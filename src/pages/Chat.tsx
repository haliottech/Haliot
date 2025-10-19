import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import Header from "@/components/Layout/Header";

interface Profile {
  id: string;
  full_name: string;
  affiliation: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: Profile;
}

interface Conversation {
  id: string;
  updated_at: string;
  other_participant?: Profile;
  last_message?: string;
}

interface Collaboration {
  id: string;
  title: string;
  description: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUsers, setOtherUsers] = useState<Profile[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`conversation:${selectedConversation}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation}`
          },
          (payload) => {
            fetchMessages(selectedConversation);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    
    setCurrentUserId(session.user.id);
    await Promise.all([
      fetchConversations(session.user.id),
      fetchCollaborations(session.user.id),
      fetchOtherUsers(session.user.id)
    ]);
    setLoading(false);
  };

  const fetchConversations = async (userId: string) => {
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, conversations(*)")
      .eq("user_id", userId);

    if (!participants) return;

    const conversationsWithDetails = await Promise.all(
      participants.map(async (p: any) => {
        // Get other participant
        const { data: otherParticipant } = await supabase
          .from("conversation_participants")
          .select("user_id, profiles(*)")
          .eq("conversation_id", p.conversation_id)
          .neq("user_id", userId)
          .single();

        // Get last message
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content")
          .eq("conversation_id", p.conversation_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          id: p.conversation_id,
          updated_at: p.conversations.updated_at,
          other_participant: otherParticipant?.profiles,
          last_message: lastMsg?.content
        };
      })
    );

    setConversations(conversationsWithDetails);
  };

  const fetchCollaborations = async (userId: string) => {
    const { data } = await supabase
      .from("collaboration_members")
      .select("collaboration_id, collaborations(*)")
      .eq("user_id", userId);

    if (data) {
      setCollaborations(data.map((d: any) => d.collaborations));
    }
  };

  const fetchOtherUsers = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", userId)
      .limit(5);

    if (data) {
      setOtherUsers(data);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation,
        sender_id: currentUserId,
        content: newMessage.trim()
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      return;
    }

    setNewMessage("");
  };

  const startConversation = async (otherUserId: string) => {
    if (!currentUserId) return;

    try {
      console.log('Starting conversation with user:', otherUserId);
      
      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (convError) {
        console.error('Conversation creation error:', convError);
        toast({
          title: "Error",
          description: "Failed to create conversation: " + convError.message,
          variant: "destructive"
        });
        return;
      }

      if (!conv) {
        console.error('No conversation returned');
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive"
        });
        return;
      }

      console.log('Conversation created:', conv.id);

      // Add participants
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: conv.id, user_id: currentUserId },
          { conversation_id: conv.id, user_id: otherUserId }
        ]);

      if (partError) {
        console.error('Participants error:', partError);
        toast({
          title: "Error",
          description: "Failed to add participants: " + partError.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Participants added successfully');
      await fetchConversations(currentUserId);
      setSelectedConversation(conv.id);
      
      toast({
        title: "Success",
        description: "Conversation started successfully",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const selectedConvData = conversations.find(c => c.id === selectedConversation);

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Research Collaboration Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Conversations & Projects */}
          <Card className="p-6 h-[600px] overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Conversations</h3>
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conv.id ? 'bg-accent/20' : 'hover:bg-muted'
                      }`}
                    >
                      <Avatar className="h-10 w-10 bg-accent/20">
                        <AvatarFallback className="bg-accent/20 text-accent">
                          {getInitials(conv.other_participant?.full_name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{conv.other_participant?.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Ongoing Projects</h3>
                <div className="space-y-3">
                  {collaborations.map((collab) => (
                    <div key={collab.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer">
                      <Avatar className="h-10 w-10 bg-accent/20">
                        <AvatarFallback className="bg-accent/20 text-accent">P</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{collab.title}</p>
                        <p className="text-xs text-muted-foreground">{collab.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Middle Column - Chat */}
          <Card className="p-6 flex flex-col h-[600px]">
            {selectedConvData ? (
              <>
                <div className="flex items-center gap-3 pb-4 border-b mb-4">
                  <Avatar className="h-10 w-10 bg-accent/20">
                    <AvatarFallback className="bg-accent/20 text-accent">
                      {getInitials(selectedConvData.other_participant?.full_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedConvData.other_participant?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConvData.other_participant?.affiliation}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender_id === currentUserId ? 'justify-end' : ''}`}
                    >
                      {msg.sender_id !== currentUserId && (
                        <Avatar className="h-8 w-8 bg-accent/20">
                          <AvatarFallback className="bg-accent/20 text-accent text-xs">
                            {getInitials(msg.sender?.full_name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`rounded-lg p-3 max-w-[70%] ${
                          msg.sender_id === currentUserId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                  />
                  <Button onClick={sendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a conversation to start chatting
              </div>
            )}
          </Card>

          {/* Right Column - Contact Info */}
          <Card className="p-6 h-[600px] overflow-y-auto">
            <h3 className="font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              {otherUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                  <Avatar className="h-10 w-10 bg-accent/20">
                    <AvatarFallback className="bg-accent/20 text-accent">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.affiliation}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => startConversation(user.id)}
                  >
                    Message
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t space-y-2">
              <Button variant="outline" className="w-full" onClick={() => navigate("/profile")}>
                View Profile
              </Button>
              <Button className="w-full">
                Start Collaboration
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Chat;

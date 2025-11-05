import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Send, ArrowLeft, Users, BarChart3, Plus, ThumbsUp, Heart, Smile, MoreVertical, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RoomMessage {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
  reactions?: {
    type: string;
    count: number;
  }[];
}

interface RoomPoll {
  id: string;
  question: string;
  options: string[];
  is_active: boolean;
  created_at: string;
  votes?: {
    option_index: number;
    count: number;
  }[];
  userVote?: number;
}

interface DiscussionRoom {
  id: string;
  title: string;
  description: string;
  topic: string;
  created_by: string;
  isMember: boolean;
}

const RoomChat = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<DiscussionRoom | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [polls, setPolls] = useState<RoomPoll[]>([]);
  const [combinedFeed, setCombinedFeed] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState(["", ""]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  useEffect(() => {
    if (room && currentUser) {
      fetchMessages();
      fetchPolls();
      subscribeToRoom();
      return () => {
        // Cleanup subscription
      };
    }
  }, [room, currentUser]);

  useEffect(() => {
    // Combine and sort messages and polls by time
    const combined = [
      ...messages.map(msg => ({ ...msg, type: 'message', timestamp: new Date(msg.created_at).getTime() })),
      ...polls.map(poll => ({ ...poll, type: 'poll', timestamp: new Date(poll.created_at).getTime() }))
    ].sort((a, b) => a.timestamp - b.timestamp);
    
    setCombinedFeed(combined);
  }, [messages, polls]);

  const fetchRoom = async () => {
    if (!roomId) return;

    const { data: roomData, error } = await (supabase.from("discussion_rooms") as any)
      .select("*")
      .eq("id", roomId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Room not found",
        variant: "destructive",
      });
      navigate("/explore");
      return;
    }

    if (roomData) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await (supabase.from("room_members") as any)
          .select("id")
          .eq("room_id", roomId)
          .eq("user_id", user.id)
          .single();

        setRoom({
          ...roomData,
          isMember: !!member,
        });
      } else {
        setRoom({ ...roomData, isMember: false });
      }
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    if (!roomId) return;

    const { data: messagesData, error } = await (supabase.from("room_messages") as any)
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    if (messagesData) {
      const messagesWithDetails = await Promise.all(
        messagesData.map(async (msg: any) => {
          let user = { full_name: "Unknown", avatar_url: null };
          if (msg.user_id) {
            const { data: userProfile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", msg.user_id)
              .single();
            if (userProfile) {
              user = userProfile;
            }
          }

          const { data: reactions } = await (supabase.from("message_reactions") as any)
            .select("reaction_type")
            .eq("message_id", msg.id);

          const reactionCounts: { [key: string]: number } = {};
          reactions?.forEach((r) => {
            reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
          });

          return {
            ...msg,
            user,
            reactions: Object.entries(reactionCounts).map(([type, count]) => ({ type, count })),
          };
        })
      );
      setMessages(messagesWithDetails);
    }
  };

  const fetchPolls = async () => {
    if (!roomId) return;

    const { data: pollsData, error } = await (supabase.from("room_polls") as any)
      .select("*")
      .eq("room_id", roomId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching polls:", error);
      return;
    }

    if (pollsData && currentUser) {
      const pollsWithVotes = await Promise.all(
        pollsData.map(async (poll: any) => {
          const { data: votes } = await (supabase.from("poll_votes") as any)
            .select("option_index")
            .eq("poll_id", poll.id);

          const voteCounts: { [key: number]: number } = {};
          votes?.forEach((v: any) => {
            voteCounts[v.option_index] = (voteCounts[v.option_index] || 0) + 1;
          });

          const { data: userVote } = await (supabase.from("poll_votes") as any)
            .select("option_index")
            .eq("poll_id", poll.id)
            .eq("user_id", currentUser.id)
            .single();

          return {
            ...poll,
            options: Array.isArray(poll.options) ? poll.options : [],
            votes: Object.entries(voteCounts).map(([idx, count]) => ({
              option_index: parseInt(idx),
              count,
            })),
            userVote: userVote?.option_index,
          };
        })
      );
      setPolls(pollsWithVotes);
    }
  };

  const subscribeToRoom = () => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_polls",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchPolls();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_reactions",
        },
        () => {
          fetchMessages();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "poll_votes",
        },
        () => {
          fetchPolls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!roomId || !currentUser || !newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    const { error } = await (supabase.from("room_messages") as any)
      .insert({
        room_id: roomId,
        user_id: currentUser.id,
        content: messageContent,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      setNewMessage(messageContent); // Restore message on error
    } else {
      // Fetch messages again to ensure it appears
      setTimeout(() => {
        fetchMessages();
      }, 100);
    }
  };

  const handleReact = async (messageId: string, reactionType: string) => {
    if (!currentUser) return;

    const { data: existing } = await (supabase.from("message_reactions") as any)
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", currentUser.id)
      .eq("reaction_type", reactionType)
      .single();

    if (existing) {
      await (supabase.from("message_reactions") as any)
        .delete()
        .eq("id", existing.id);
    } else {
      await (supabase.from("message_reactions") as any)
        .insert({
          message_id: messageId,
          user_id: currentUser.id,
          reaction_type: reactionType,
        });
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!currentUser) return;

    const { error } = await (supabase.from("poll_votes") as any)
      .insert({
        poll_id: pollId,
        user_id: currentUser.id,
        option_index: optionIndex,
      });

    if (error) {
      await (supabase.from("poll_votes") as any)
        .update({ option_index: optionIndex })
        .eq("poll_id", pollId)
        .eq("user_id", currentUser.id);
    }
  };

  const handleCreatePoll = async () => {
    if (!roomId || !currentUser || !newPollQuestion.trim()) {
      toast({
        title: "Error",
        description: "Please provide a poll question",
        variant: "destructive",
      });
      return;
    }

    const validOptions = newPollOptions.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please provide at least 2 options",
        variant: "destructive",
      });
      return;
    }

    const { error } = await (supabase.from("room_polls") as any)
      .insert({
        room_id: roomId,
        created_by: currentUser.id,
        question: newPollQuestion,
        options: validOptions,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create poll",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Poll created successfully!",
      });
      setShowCreatePoll(false);
      setNewPollQuestion("");
      setNewPollOptions(["", ""]);
    }
  };

  const handleJoinRoom = async () => {
    if (!currentUser || !roomId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join discussion rooms",
      });
      return;
    }

    const { error } = await (supabase.from("room_members") as any)
      .insert({ room_id: roomId, user_id: currentUser.id });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to join room",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "You've joined the room!",
      });
      fetchRoom();
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading room...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div 
      className="h-screen flex flex-col bg-muted/30"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%23e5e5e5' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
      }}
    >
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-3 shadow-lg flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/explore")}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-semibold text-lg text-primary-foreground">{room.title}</h1>
          {room.description && (
            <p className="text-sm text-primary-foreground/80 line-clamp-1">{room.description}</p>
          )}
        </div>
        {room.isMember && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCreatePoll(true)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {!room.isMember ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground mb-6">You need to join this room to participate</p>
            <Button onClick={handleJoinRoom}>Join Room</Button>
          </div>
        ) : combinedFeed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="text-center space-y-3">
              <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto" />
              <p className="text-lg font-medium text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground/70">Start the conversation!</p>
            </div>
          </div>
        ) : (
          combinedFeed.map((item: any, index: number) => {
            if (item.type === 'message') {
              const isOwnMessage = item.user_id === currentUser?.id;
              const prevItem = combinedFeed[index - 1];
              const showAvatar = !prevItem || prevItem.type !== 'message' || prevItem.user_id !== item.user_id;
              const showName = !isOwnMessage && showAvatar;
              
              return (
                <div
                  key={item.id}
                  className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-2' : 'mt-1'}`}
                >
                  {!isOwnMessage && (
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <Avatar className="h-10 w-10 ring-2 ring-background">
                          {item.user?.avatar_url ? (
                            <AvatarImage src={item.user.avatar_url} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                              {item.user?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ) : (
                        <div className="w-10" />
                      )}
                    </div>
                  )}
                  <div className={`max-w-[75%] sm:max-w-[65%] ${isOwnMessage ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                    {showName && (
                      <span className="text-xs font-medium text-foreground mb-1.5 px-1">
                        {item.user?.full_name || "Unknown"}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm transition-all ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-card border border-border/50 rounded-bl-md"
                      }`}
                    >
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        isOwnMessage ? 'text-primary-foreground' : 'text-foreground'
                      }`}>
                        {item.content}
                      </p>
                      <div className={`flex items-center gap-1.5 mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[10px] ${
                          isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                        }`}>
                          {formatTime(item.created_at)}
                        </span>
                      </div>
                    </div>
                    {item.reactions && item.reactions.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {item.reactions.map((reaction: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleReact(item.id, reaction.type)}
                            className="text-xs px-2.5 py-1 bg-background/80 backdrop-blur-sm rounded-full border border-border/50 hover:bg-background hover:border-primary/40 transition-all shadow-sm hover:shadow-md"
                          >
                            <span className="mr-1.5">{reaction.type}</span>
                            <span className="font-semibold text-foreground">{reaction.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {isOwnMessage && (
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <Avatar className="h-10 w-10 ring-2 ring-background">
                          {item.user?.avatar_url ? (
                            <AvatarImage src={item.user.avatar_url} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                              {item.user?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ) : (
                        <div className="w-10" />
                      )}
                    </div>
                  )}
                </div>
              );
            } else if (item.type === 'poll') {
              return (
                <div key={item.id} className="flex justify-center my-4">
                  <div className="bg-card rounded-2xl shadow-lg p-6 max-w-md w-full border border-border/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2.5 bg-primary/10 rounded-xl">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="font-semibold text-lg text-foreground flex-1">{item.question}</h4>
                    </div>
                    <div className="space-y-3">
                      {item.options.map((option: string, idx: number) => {
                        const voteCount = item.votes?.find((v: any) => v.option_index === idx)?.count || 0;
                        const totalVotes = item.votes?.reduce((sum: number, v: any) => sum + v.count, 0) || 0;
                        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                        const isVoted = item.userVote === idx;

                        return (
                          <button
                            key={idx}
                            onClick={() => handleVote(item.id, idx)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                              isVoted
                                ? "border-primary bg-primary/10 shadow-md"
                                : "border-border/50 hover:border-primary/40 bg-background/50 hover:bg-background"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-sm font-semibold text-foreground">{option}</span>
                              <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-full">
                                {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                              </span>
                            </div>
                            <div className="w-full bg-muted/60 rounded-full h-3 overflow-hidden mb-2">
                              <div
                                className="bg-primary h-full rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            {percentage > 0 && (
                              <span className="text-xs font-medium text-muted-foreground">{Math.round(percentage)}%</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground text-center">
                      {getTimeAgo(item.created_at)}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
      </div>

      {/* Input Area */}
      {room.isMember && (
        <div className="bg-card/95 backdrop-blur-md border-t border-border/50 px-4 sm:px-6 py-4 shadow-2xl">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full bg-background border-border/60 rounded-2xl px-5 py-3 pr-12 text-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/50 transition-all"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="icon"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-11 w-11 p-0 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Poll Dialog */}
      <Dialog open={showCreatePoll} onOpenChange={setShowCreatePoll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Poll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Poll Question"
              value={newPollQuestion}
              onChange={(e) => setNewPollQuestion(e.target.value)}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Options</label>
              {newPollOptions.map((option, idx) => (
                <Input
                  key={idx}
                  placeholder={`Option ${idx + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...newPollOptions];
                    newOptions[idx] = e.target.value;
                    setNewPollOptions(newOptions);
                  }}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewPollOptions([...newPollOptions, ""])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
            <Button onClick={handleCreatePoll} className="w-full bg-primary hover:bg-primary/90">
              Create Poll
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomChat;


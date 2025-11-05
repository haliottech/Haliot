import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Users, TrendingUp, ThumbsUp, Heart, Smile, Plus, Loader2, BarChart3, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DiscussionRoom {
  id: string;
  title: string;
  description: string;
  topic: string;
  created_by: string;
  member_count: number;
  message_count: number;
  is_active: boolean;
  created_at: string;
  creator?: {
    full_name: string;
    avatar_url: string;
  };
  isMember: boolean;
}

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

const Explore = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<DiscussionRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [canCreateRoom, setCanCreateRoom] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomTopic, setNewRoomTopic] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        checkRoomCreationPermission(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        checkRoomCreationPermission(session.user.id);
      } else {
        setCanCreateRoom(false);
        setUserProfile(null);
      }
    });

    fetchRooms();

    return () => subscription.unsubscribe();
  }, []);

  const checkRoomCreationPermission = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("verification_status")
        .eq("id", userId)
        .single();

      setUserProfile(profile);

      // Check if user has admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const isAdmin = roles?.some((r: any) => r.role === "admin") || false;
      const isVerified = profile?.verification_status === "verified";

      // Allow room creation for admins or verified users
      setCanCreateRoom(isAdmin || isVerified);
    } catch (error) {
      console.error("Error checking room creation permission:", error);
      setCanCreateRoom(false);
    }
  };


  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data: roomsData, error } = await (supabase.from("discussion_rooms") as any)
        .select("*")
        .eq("is_active", true)
        .order("member_count", { ascending: false });

      if (error) {
        console.error("Error fetching rooms:", error);
        toast({
          title: "Error Loading Rooms",
          description: error.message || "Failed to load discussion rooms. Please check if the tables exist in your database.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

    if (roomsData) {
      const roomsWithMembership = await Promise.all(
        roomsData.map(async (room: any) => {
          // Fetch creator profile separately
          let creator = { full_name: "Unknown", avatar_url: null };
          if (room.created_by) {
            const { data: creatorProfile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", room.created_by)
              .single();
            if (creatorProfile) {
              creator = creatorProfile;
            }
          }

          // Get actual member count
          const { count: memberCount } = await (supabase.from("room_members") as any)
            .select("*", { count: "exact", head: true })
            .eq("room_id", room.id);

          // Get actual message count
          const { count: msgCount } = await (supabase.from("room_messages") as any)
            .select("*", { count: "exact", head: true })
            .eq("room_id", room.id);

          // Check if current user is a member
          let isMember = false;
          if (currentUser) {
            const { data: member } = await (supabase.from("room_members") as any)
              .select("id")
              .eq("room_id", room.id)
              .eq("user_id", currentUser.id)
              .single();
            isMember = !!member;
          }

          return {
            ...room,
            creator,
            member_count: memberCount || 0,
            message_count: msgCount || 0,
            isMember,
          };
        })
      );
      setRooms(roomsWithMembership);
    }
    } catch (err: any) {
      console.error("Unexpected error fetching rooms:", err);
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred while loading rooms.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (room: DiscussionRoom, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join discussion rooms",
      });
      return;
    }

    const { error } = await (supabase.from("room_members") as any)
      .insert({ room_id: room.id, user_id: currentUser.id });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to join room",
        variant: "destructive",
      });
    } else {
      // Update member count
      await (supabase.from("discussion_rooms") as any)
        .update({ member_count: (room.member_count || 0) + 1 })
        .eq("id", room.id);

      toast({
        title: "Success",
        description: "You've joined the room!",
      });
      fetchRooms();
    }
  };

  const handleCreateRoom = async () => {
    if (!currentUser || !newRoomTitle.trim()) {
      toast({
        title: "Error",
        description: "Please provide a room title",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await (supabase.from("discussion_rooms") as any)
        .insert({
          title: newRoomTitle,
          description: newRoomDescription || null,
          topic: newRoomTopic || null,
          created_by: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating room:", error);
        toast({
          title: "Failed to Create Room",
          description: error.message || "Failed to create room. Please check if the discussion_rooms table exists and you have proper permissions.",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "Error",
          description: "Room was not created. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Join the room as creator
      const { error: memberError } = await (supabase.from("room_members") as any)
        .insert({ room_id: data.id, user_id: currentUser.id, role: "admin" });

      if (memberError) {
        console.error("Error joining room as creator:", memberError);
        // Still show success but warn about membership
        toast({
          title: "Room Created",
          description: "Room created but failed to join automatically. Please join manually.",
          variant: "default",
        });
      }

      toast({
        title: "Success",
        description: "Room created successfully!",
      });
      setShowCreateRoom(false);
      setNewRoomTitle("");
      setNewRoomDescription("");
      setNewRoomTopic("");
      await fetchRooms();
    } catch (err: any) {
      console.error("Unexpected error creating room:", err);
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred while creating the room.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Discussion Rooms</h1>
              <p className="text-muted-foreground text-lg mt-2">
                Join discussions, share ideas, and collaborate with researchers
              </p>
            </div>
            {currentUser && canCreateRoom && (
              <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-md">
                    <Plus className="h-4 w-4" />
                    Create Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Discussion Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Room Title"
                      value={newRoomTitle}
                      onChange={(e) => setNewRoomTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                    />
                    <Input
                      placeholder="Topic/Tag (optional)"
                      value={newRoomTopic}
                      onChange={(e) => setNewRoomTopic(e.target.value)}
                    />
                    <Button onClick={handleCreateRoom} className="w-full">
                      Create Room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Rooms Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className="hover:shadow-lg transition-all cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm"
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{room.title}</CardTitle>
                        {room.topic && (
                          <Badge variant="secondary" className="mb-2">
                            {room.topic}
                          </Badge>
                        )}
                      </div>
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {room.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {room.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{room.member_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{room.message_count || 0}</span>
                        </div>
                      </div>
                      {!room.isMember && (
                        <Button
                          size="sm"
                          onClick={(e) => handleJoinRoom(room, e)}
                        >
                          Join
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

                 {rooms.length === 0 && !loading && (
                   <Card className="p-12 text-center border-border/50 bg-card/50 backdrop-blur-sm">
                     <MessageSquare className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                     <p className="text-lg text-muted-foreground mb-6">No discussion rooms yet</p>
                     {currentUser && canCreateRoom && (
                       <Button onClick={() => setShowCreateRoom(true)} className="bg-primary hover:bg-primary/90">
                         <Plus className="h-4 w-4 mr-2" />
                         Create First Room
                       </Button>
                     )}
                     {currentUser && !canCreateRoom && (
                       <p className="text-sm text-muted-foreground">
                         Room creation is limited to verified researchers and administrators.
                       </p>
                     )}
                   </Card>
                 )}
        </div>
      </main>

    </div>
  );
};

export default Explore;

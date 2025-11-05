import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { User } from "@supabase/supabase-js";
import Header from "@/components/Layout/Header";
import { FileText, Camera, Award, Linkedin, GraduationCap, BookOpen, UserPlus, UserMinus, ThumbsUp, MessageCircle, ExternalLink, Mail, Calendar } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [endorsements, setEndorsements] = useState<any[]>([]);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    publications: 0,
    endorsements: 0
  });

  // Determine which user's profile to show
  const profileUserId = userId || currentUser?.id;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (profileUserId) {
      fetchProfile();
      fetchUserPosts();
      fetchStats();
      fetchEndorsements();
      if (currentUser && currentUser.id !== profileUserId) {
        checkIfFollowing();
      }
    }
  }, [profileUserId, currentUser]);

  const fetchProfile = async () => {
    if (!profileUserId) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileUserId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(data);
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    if (!profileUserId) return;
    
    const { data, error } = await supabase
      .from("research_posts")
      .select(`
        *,
        profiles!inner(full_name, avatar_url)
      `)
      .eq("user_id", profileUserId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch likes and comments counts for each post
      const postsWithCounts = await Promise.all(
        data.map(async (post) => {
          const [likesResult, commentsResult] = await Promise.all([
            supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", post.id),
            supabase.from("comments").select("*", { count: "exact", head: true }).eq("post_id", post.id)
          ]);
          
          return {
            ...post,
            likesCount: likesResult.count || 0,
            commentsCount: commentsResult.count || 0
          };
        })
      );
      
      setUserPosts(postsWithCounts);
    }
  };

  const fetchStats = async () => {
    if (!profileUserId) return;

    // Get followers count
    const { count: followersCount } = await (supabase as any)
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profileUserId);

    // Get following count
    const { count: followingCount } = await (supabase as any)
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profileUserId);

    // Get publications count (from research_posts)
    const { count: publicationsCount } = await supabase
      .from("research_posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileUserId);

    // Get endorsements count
    const { count: endorsementsCount } = await (supabase as any)
      .from("endorsements")
      .select("*", { count: "exact", head: true })
      .eq("endorsee_id", profileUserId);

    setStats({
      followers: followersCount || 0,
      following: followingCount || 0,
      publications: publicationsCount || 0,
      endorsements: endorsementsCount || 0
    });
  };

  const fetchEndorsements = async () => {
    if (!profileUserId) return;

    const { data, error } = await (supabase as any)
      .from("endorsements")
      .select(`
        *,
        endorser:profiles!endorsements_endorser_id_fkey(id, full_name, avatar_url)
      `)
      .eq("endorsee_id", profileUserId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEndorsements(data);
    }
  };

  const checkIfFollowing = async () => {
    if (!currentUser || !profileUserId || currentUser.id === profileUserId) return;

    const { data } = await (supabase as any)
      .from("user_follows")
      .select("*")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profileUserId)
      .single();

    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    if (!profileUserId || currentUser.id === profileUserId) return;

    if (isFollowing) {
      const { error } = await (supabase as any)
        .from("user_follows")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", profileUserId);

      if (!error) {
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      }
    } else {
      const { error } = await (supabase as any)
        .from("user_follows")
        .insert({
          follower_id: currentUser.id,
          following_id: profileUserId
        });

      if (!error) {
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser || currentUser.id !== profileUserId) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile photo updated!",
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser || currentUser.id !== profileUserId) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile?.full_name,
        affiliation: profile?.affiliation,
        bio: profile?.bio,
        linkedin_url: profile?.linkedin_url,
        domain_expertise: profile?.domain_expertise,
      })
      .eq("id", currentUser.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setEditMode(false);
      fetchProfile();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const isOwnProfile = currentUser && profileUserId && currentUser.id === profileUserId;

  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 
                   profile?.email?.charAt(0).toUpperCase() || 'U';

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground text-lg">Loading profile...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="text-center py-24">
              <p className="text-muted-foreground text-lg">Profile not found</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-40 w-40 lg:h-48 lg:w-48 border-4 border-background shadow-xl ring-4 ring-primary/20">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
                  ) : (
                    <AvatarFallback className="text-5xl lg:text-6xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                {isOwnProfile && (
                  <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-3 cursor-pointer hover:bg-primary/90 shadow-lg transition-all hover:scale-110">
                    <Camera className="h-5 w-5" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {/* Profile Header Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        {profile?.full_name || "User"}
                      </h1>
                      {profile?.verification_status === 'verified' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 px-3 py-1 text-sm">
                          <Award className="h-4 w-4 mr-1.5" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    {profile?.affiliation && (
                      <div className="flex items-center gap-2 text-lg text-muted-foreground mb-4">
                        <GraduationCap className="h-5 w-5" />
                        <span className="font-medium">{profile.affiliation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 lg:gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">{stats.followers}</div>
                    <div className="text-sm text-muted-foreground font-medium">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">{stats.following}</div>
                    <div className="text-sm text-muted-foreground font-medium">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">{stats.publications}</div>
                    <div className="text-sm text-muted-foreground font-medium">Publications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">{stats.endorsements}</div>
                    <div className="text-sm text-muted-foreground font-medium">Endorsements</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {!isOwnProfile && currentUser && (
                    <>
                      <Button 
                        variant={isFollowing ? "outline" : "default"} 
                        size="lg"
                        className="px-6"
                        onClick={handleFollow}
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="h-5 w-5 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-5 w-5 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="lg" className="px-6" onClick={() => navigate("/chat")}>
                        <Mail className="h-5 w-5 mr-2" />
                        Message
                      </Button>
                    </>
                  )}
                  
                  {isOwnProfile && (
                    <>
                      <Button variant="default" size="lg" className="px-6" onClick={() => setEditMode(true)}>
                        Edit Profile
                      </Button>
                      <Button variant="outline" size="lg" className="px-6" onClick={handleSignOut}>
                        Sign Out
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Bio Card */}
              <Card className="p-8 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-6">About</h3>
                {editMode && isOwnProfile ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Full Name *</label>
                      <Input
                        value={profile?.full_name || ""}
                        onChange={(e) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            full_name: e.target.value,
                          }))
                        }
                        placeholder="Enter your full name"
                        className="h-11"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold mb-2">Affiliation *</label>
                      <Input
                        value={profile?.affiliation || ""}
                        onChange={(e) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            affiliation: e.target.value,
                          }))
                        }
                        placeholder="University, Company, Institution"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">LinkedIn URL</label>
                      <Input
                        value={profile?.linkedin_url || ""}
                        onChange={(e) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            linkedin_url: e.target.value,
                          }))
                        }
                        placeholder="https://linkedin.com/in/yourprofile"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Bio *</label>
                      <Textarea
                        value={profile?.bio || ""}
                        onChange={(e) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            bio: e.target.value,
                          }))
                        }
                        placeholder="Tell us about your research interests and background"
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button onClick={handleUpdateProfile} className="flex-1" size="lg">
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1" size="lg">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {profile?.bio ? (
                      <p className="text-base text-muted-foreground leading-relaxed mb-6">
                        {profile.bio}
                      </p>
                    ) : (
                      <p className="text-base text-muted-foreground italic mb-6">
                        No bio available
                      </p>
                    )}

                    <Separator className="my-6" />

                    {/* Domain Expertise */}
                    {profile?.domain_expertise && profile.domain_expertise.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-4 text-foreground">Domain Expertise</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.domain_expertise.map((exp: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                              {exp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile?.linkedin_url && (
                      <>
                        <Separator className="my-6" />
                        <a 
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-base text-primary hover:text-primary/80 font-medium transition-colors group"
                        >
                          <Linkedin className="h-5 w-5" />
                          <span>LinkedIn Profile</span>
                          <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </>
                    )}
                  </>
                )}
              </Card>
            </div>

            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Publication History */}
              {profile?.publication_history && Array.isArray(profile.publication_history) && profile.publication_history.length > 0 && (
                <Card className="p-8 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Publication History</h2>
                  </div>
                  <div className="space-y-4">
                    {profile.publication_history.map((pub: any, idx: number) => (
                      <div key={idx} className="p-5 border border-border/50 rounded-xl hover:border-primary/30 transition-all bg-muted/30">
                        <h4 className="font-semibold text-lg mb-2">{pub.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{pub.year}</span>
                          </div>
                          {pub.link && (
                            <a 
                              href={pub.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors group"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>View Publication</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Endorsements */}
              {endorsements.length > 0 && (
                <Card className="p-8 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ThumbsUp className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Peer Endorsements</h2>
                  </div>
                  <div className="space-y-4">
                    {endorsements.map((endorsement) => (
                      <div key={endorsement.id} className="p-5 border border-border/50 rounded-xl hover:border-primary/30 transition-all bg-muted/30">
                        <div className="flex items-start gap-4 mb-3">
                          <Avatar className="h-12 w-12 border-2 border-border">
                            {endorsement.endorser?.avatar_url ? (
                              <img src={endorsement.endorser.avatar_url} alt={endorsement.endorser.full_name} />
                            ) : (
                              <AvatarFallback className="text-base">{endorsement.endorser?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-base mb-1">{endorsement.endorser?.full_name || 'Unknown'}</p>
                            <Badge variant="secondary" className="text-xs">{endorsement.skill}</Badge>
                          </div>
                        </div>
                        {endorsement.comment && (
                          <p className="text-sm text-muted-foreground leading-relaxed pl-16">{endorsement.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Research Posts & Discussion Threads */}
              <Card className="p-8 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
                <Tabs defaultValue="publications" className="w-full">
                  <TabsList className="mb-8 h-12">
                    <TabsTrigger value="publications" className="text-base px-6">Research Summaries</TabsTrigger>
                    <TabsTrigger value="discussions" className="text-base px-6">Discussion Threads</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="publications" className="space-y-6 mt-0">
                    {userPosts.map((post) => (
                      <div key={post.id} className="flex gap-6 p-6 border border-border/50 rounded-xl hover:border-primary/30 hover:bg-muted/30 transition-all group">
                        <div className="flex-shrink-0">
                          <div className="w-20 h-24 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-all">
                            <FileText className="h-10 w-10 text-primary/60" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                          <p className="text-base text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                            {post.summary}
                          </p>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {getTimeAgo(post.created_at)}
                            </span>
                            {post.likesCount > 0 && (
                              <span className="flex items-center gap-1.5">
                                <ThumbsUp className="h-4 w-4" />
                                {post.likesCount}
                              </span>
                            )}
                            {post.commentsCount > 0 && (
                              <span className="flex items-center gap-1.5">
                                <MessageCircle className="h-4 w-4" />
                                {post.commentsCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {userPosts.length === 0 && (
                      <div className="text-center py-16">
                        <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-lg text-muted-foreground mb-6">No research posts yet</p>
                        {isOwnProfile && (
                          <Button onClick={() => navigate("/create")} size="lg">
                            Create Your First Post
                          </Button>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="discussions" className="space-y-6 mt-0">
                    {userPosts.map((post) => (
                      <div key={post.id} className="p-6 border border-border/50 rounded-xl hover:border-primary/30 hover:bg-muted/30 transition-all">
                        <h4 className="font-semibold text-lg mb-2">{post.title}</h4>
                        <p className="text-base text-muted-foreground mb-4 line-clamp-2">{post.summary}</p>
                        <Button 
                          variant="outline" 
                          size="lg"
                          onClick={() => navigate(`/post/${post.id}`)}
                          className="group"
                        >
                          View Discussion Thread
                          <ExternalLink className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </div>
                    ))}
                    
                    {userPosts.length === 0 && (
                      <div className="text-center py-16">
                        <MessageCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-lg text-muted-foreground">No discussion threads yet</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;

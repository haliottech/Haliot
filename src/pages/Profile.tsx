import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@supabase/supabase-js";
import Header from "@/components/Layout/Header";
import { FileText, MessageCircle, Camera, Award, AlertCircle, Linkedin } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    publications: 0
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserPosts();

      const profileChannel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          () => fetchProfile()
        )
        .subscribe();

      const postsChannel = supabase
        .channel('posts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'research_posts',
            filter: `user_id=eq.${user.id}`
          },
          () => fetchUserPosts()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profileChannel);
        supabase.removeChannel(postsChannel);
      };
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const fetchUserPosts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("research_posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUserPosts(data);
      setStats(prev => ({ ...prev, publications: data.length }));
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

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
        .eq('id', user.id);

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
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile?.full_name,
        affiliation: profile?.affiliation,
        profession: profile?.profession,
        bio: profile?.bio,
        linkedin_url: profile?.linkedin_url,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      // Update profile completion score
      await supabase.rpc('calculate_profile_completion', { user_id: user.id });
      
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

  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 
                   profile?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">
          User Profile {profile?.full_name || 'Profile'}
        </h1>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Overview */}
            <Card className="p-6 h-fit">
              <h3 className="font-semibold mb-6 text-center">Profile Overview</h3>
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-32 w-32 bg-accent/20">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
                    ) : (
                      <AvatarFallback className="text-4xl bg-accent/20 text-accent">
                        {initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                    <Camera className="h-4 w-4" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                
                {editMode ? (
                  <div className="space-y-4 w-full">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <Input
                        value={profile?.full_name || ""}
                        onChange={(e) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            full_name: e.target.value,
                          }))
                        }
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Affiliation *</label>
                      <Input
                        value={profile?.affiliation || ""}
                        onChange={(e) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            affiliation: e.target.value,
                          }))
                        }
                        placeholder="University, Company, Institution"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Profession *</label>
                      <Input
                        value={profile?.profession || ""}
                        onChange={(e) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            profession: e.target.value,
                          }))
                        }
                        placeholder="Researcher, Professor, Student, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">LinkedIn URL</label>
                      <Input
                        value={profile?.linkedin_url || ""}
                        onChange={(e) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            linkedin_url: e.target.value,
                          }))
                        }
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Bio *</label>
                      <Textarea
                        value={profile?.bio || ""}
                        onChange={(e) =>
                          setProfile((prev: any) => ({
                            ...prev,
                            bio: e.target.value,
                          }))
                        }
                        placeholder="Tell us about your research interests and background"
                        rows={4}
                      />
                    </div>

                    <Button onClick={handleUpdateProfile} className="w-full">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditMode(false)} className="w-full">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Profile Completion Alert */}
                    {profile?.profile_completion_score && profile.profile_completion_score < 80 && (
                      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2 text-orange-700 mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Complete Your Profile</span>
                        </div>
                        <Progress value={profile.profile_completion_score} className="h-2 mb-2" />
                        <p className="text-xs text-orange-600">
                          {profile.profile_completion_score}% complete - Add more details to improve visibility
                        </p>
                      </div>
                    )}

                    <h2 className="text-xl font-bold mb-1">
                      {profile?.full_name || "User"} (Me)
                    </h2>
                    
                    {profile?.affiliation && (
                      <p className="text-muted-foreground mb-1">
                        {profile.affiliation}
                      </p>
                    )}

                    {profile?.profession && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {profile.profession}
                      </p>
                    )}

                    {profile?.bio && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {profile.bio}
                      </p>
                    )}

                    {profile?.linkedin_url && (
                      <a 
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline mb-4"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn Profile
                      </a>
                    )}

                    {/* Profile Completion Badge */}
                    <div className="mb-4">
                      {profile?.profile_completion_score && profile.profile_completion_score >= 80 ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                          <Award className="h-3 w-3 mr-1" />
                          Complete Profile
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {profile?.profile_completion_score || 0}% Complete
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6 w-full text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Followers</p>
                        <p className="font-semibold">{stats.followers}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Following</p>
                        <p className="font-semibold">{stats.following}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Publications</p>
                        <p className="font-semibold">{stats.publications}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Diversities</p>
                        <p className="font-semibold">0</p>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full">
                      <Button variant="outline" className="flex-1" onClick={() => navigate("/chat")}>
                        Contact
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => navigate("/chat")}>
                        Message
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 w-full mt-2">
                      <Button variant="outline" onClick={() => setEditMode(true)} className="flex-1">
                        Edit Profile
                      </Button>
                      <Button variant="destructive" onClick={handleSignOut} className="flex-1">
                        Sign Out
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Middle Column - Publications */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <Tabs defaultValue="publications">
                  <TabsList className="mb-6">
                    <TabsTrigger value="publications">Publications</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="publications" className="space-y-4">
                    {userPosts.map((post) => (
                      <div key={post.id} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-20 bg-muted rounded flex items-center justify-center">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 line-clamp-2">{post.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {post.summary}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{profile?.full_name || "Unknown"}</span>
                            <span>•</span>
                            <span>{getTimeAgo(post.created_at)}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {userPosts.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">No publications yet</p>
                        <Button onClick={() => navigate("/create")}>
                          Create Your First Post
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;

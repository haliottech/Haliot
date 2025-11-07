import { useEffect, useState } from "react";
import Header from "@/components/Layout/Header";
import ResearchCard from "@/components/Feed/ResearchCard";
import ProfileSidebar from "@/components/Feed/ProfileSidebar";
import TrendingSidebar from "@/components/Feed/TrendingSidebar";
import { Card } from "@/components/ui/card";
import { Bookmark, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Saved = () => {
  const navigate = useNavigate();
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndFetchSaved();
  }, []);

  // Set up realtime subscription when user is available
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to realtime changes in saved_posts
    const channel = supabase
      .channel('saved_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_posts',
          filter: `user_id=eq.${currentUser.id}`
        },
        () => {
          // Refresh the list when saved posts change
          fetchSavedPosts(currentUser.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const checkAuthAndFetchSaved = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to view your saved posts",
      });
      navigate("/auth");
      return;
    }
    setCurrentUser(session.user);
    fetchSavedPosts(session.user.id);
  };

  const fetchSavedPosts = async (userId: string) => {
    setLoading(true);
    try {
      // First, get all saved post IDs for the current user
      const { data: savedData, error: savedError } = await supabase
        .from("saved_posts")
        .select("post_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (savedError) {
        // If table doesn't exist, show helpful message
        if (savedError.code === 'PGRST116' || savedError.message.includes('does not exist')) {
          toast({
            title: "Feature not available",
            description: "The saved posts feature requires database setup. Please contact support.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        throw savedError;
      }

      if (!savedData || savedData.length === 0) {
        setSavedPosts([]);
        setLoading(false);
        return;
      }

      // Extract post IDs
      const postIds = savedData.map((item) => item.post_id);

      // Fetch the actual posts with their author information
      const { data: postsData, error: postsError } = await supabase
        .from("research_posts")
        .select(`
          *,
          profiles (full_name, email, affiliation, avatar_url)
        `)
        .in("id", postIds);

      if (postsError) {
        throw postsError;
      }

      // Sort posts by saved_at date (most recently saved first)
      const sortedPosts = (postsData || []).sort((a, b) => {
        const aSaved = savedData.find((s) => s.post_id === a.id);
        const bSaved = savedData.find((s) => s.post_id === b.id);
        if (!aSaved || !bSaved) return 0;
        return new Date(bSaved.created_at).getTime() - new Date(aSaved.created_at).getTime();
      });

      setSavedPosts(sortedPosts);
    } catch (err: any) {
      console.error("Error fetching saved posts:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to load saved posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar */}
          <aside className="lg:col-span-3 space-y-6">
            <ProfileSidebar />
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">Saved Posts</h1>
                {!loading && savedPosts.length > 0 && (
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {savedPosts.length} {savedPosts.length === 1 ? 'post' : 'posts'}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">
                Posts you've bookmarked for later
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading saved posts...</p>
                </div>
              </div>
            ) : savedPosts.length === 0 ? (
              <Card className="p-12 text-center border-border/50 bg-card/50 backdrop-blur-sm">
                <Bookmark className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-2">No saved posts yet</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Start saving posts you find interesting to view them here later.
                </p>
                <Link to="/">
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    <Bookmark className="h-4 w-4" />
                    Browse Posts
                  </button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-6">
                {savedPosts.map((post) => (
                  <ResearchCard
                    key={post.id}
                    id={post.id}
                    author={post.profiles?.full_name || post.profiles?.email || "Anonymous"}
                    authorAffiliation={post.profiles?.affiliation}
                    authorAvatar={post.profiles?.avatar_url}
                    title={post.title}
                    summary={post.summary}
                    tags={post.tags || []}
                    timeAgo={getTimeAgo(post.created_at)}
                    userId={post.user_id}
                    documentUrl={post.document_url}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-3">
            <TrendingSidebar />
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Saved;


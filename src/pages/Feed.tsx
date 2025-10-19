import { useEffect, useState } from "react";
import Header from "@/components/Layout/Header";
import ResearchCard from "@/components/Feed/ResearchCard";
import ProfileSidebar from "@/components/Feed/ProfileSidebar";
import TrendingSidebar from "@/components/Feed/TrendingSidebar";
import { Button } from "@/components/ui/button";
import { PenSquare, Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("research_posts")
      .select(`
        *,
        profiles (full_name, email, affiliation, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } else {
      setPosts(data || []);
    }
    setLoading(false);
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <aside className="lg:col-span-3 space-y-6">
            <ProfileSidebar />
          </aside>

          {/* Main Feed */}
          <div className="lg:col-span-6">
            <div className="flex gap-3 mb-6">
              <Link to="/create" className="flex-1">
                <Button variant="outline" className="w-full gap-2 justify-start">
                  <Plus className="h-4 w-4" />
                  Share New Research
                </Button>
              </Link>
              <Link to="/create">
                <Button variant="outline">Post</Button>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No posts yet. Be the first to share!</p>
                <Link to="/create">
                  <Button className="gap-2">
                    <PenSquare className="h-4 w-4" />
                    Create First Post
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
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

export default Feed;

import { useEffect, useState } from "react";
import Header from "@/components/Layout/Header";
import ResearchCard from "@/components/Feed/ResearchCard";
import ProfileSidebar from "@/components/Feed/ProfileSidebar";
import TrendingSidebar from "@/components/Feed/TrendingSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PenSquare, Loader2, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const highlightedPostId = searchParams.get('postId');

  useEffect(() => {
    fetchPosts(selectedTopic);
  }, [selectedTopic, highlightedPostId]);

  const fetchPosts = async (topic?: string | null) => {
    setLoading(true);
    try {
      let query = supabase
        .from("research_posts")
        .select(`
          *,
          profiles (full_name, email, affiliation, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (topic) {
        query = query.contains("tags", [topic]);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching posts:", error);
        
        // Provide more specific error messages
        let errorMessage = "Failed to load posts";
        if (error.message.includes("timeout") || error.message.includes("Failed to fetch")) {
          errorMessage = "Connection timeout. Please check your internet connection and try again.";
        } else if (error.message.includes("JWT")) {
          errorMessage = "Authentication error. Please refresh the page.";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        const postsData = data || [];
        
        // If there's a highlighted post ID, move it to the top
        if (highlightedPostId) {
          const highlightedPost = postsData.find((p: any) => p.id === highlightedPostId);
          if (highlightedPost) {
            const otherPosts = postsData.filter((p: any) => p.id !== highlightedPostId);
            setPosts([highlightedPost, ...otherPosts]);
            
            // Scroll to the top post after a short delay
            setTimeout(() => {
              const element = document.getElementById(`post-${highlightedPostId}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Remove the query parameter from URL after scrolling
                window.history.replaceState({}, '', '/');
              }
            }, 100);
          } else {
            setPosts(postsData);
          }
        } else {
          setPosts(postsData);
        }
      }
    } catch (err: any) {
      console.error("Network error:", err);
      toast({
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your internet connection and ensure Supabase is accessible.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic((current) => (current === topic ? null : topic));
  };

  const handleClearTopic = () => {
    setSelectedTopic(null);
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

          {/* Main Feed */}
          <div className="lg:col-span-6">
            {selectedTopic && (
              <Card className="mb-6 border-primary/40 bg-primary/5">
                <div className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Showing posts tagged</p>
                    <p className="text-lg font-semibold text-primary">#{selectedTopic}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={handleClearTopic}>
                    <XCircle className="h-4 w-4" />
                    Clear filter
                  </Button>
                </div>
              </Card>
            )}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading research posts...</p>
                </div>
              </div>
            ) : posts.length === 0 ? (
              <Card className="p-12 text-center border-border/50 bg-card/50 backdrop-blur-sm">
                <PenSquare className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-6">
                  {selectedTopic
                    ? `No posts found for #${selectedTopic}. Try a different topic or clear the filter.`
                    : "No posts yet. Be the first to share!"}
                </p>
                {!selectedTopic && (
                  <Link to="/create">
                    <Button size="lg" className="gap-2">
                      <PenSquare className="h-5 w-5" />
                      Create First Post
                    </Button>
                  </Link>
                )}
                {selectedTopic && (
                  <Button variant="outline" size="lg" className="gap-2" onClick={handleClearTopic}>
                    <XCircle className="h-5 w-5" />
                    Clear filter
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-6">
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
                    documentUrl={post.document_url}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-3">
            <TrendingSidebar onSelectTopic={handleTopicSelect} activeTopic={selectedTopic} />
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Feed;

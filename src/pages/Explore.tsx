import { useEffect, useState } from "react";
import Header from "@/components/Layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TrendingTopic {
  name: string;
  count: number;
  trend: string;
}

interface ResearchArea {
  id: string;
  title: string;
  description: string;
  followers: number;
  papers: number;
  isFollowing: boolean;
}

const Explore = () => {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [researchAreas, setResearchAreas] = useState<ResearchArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    fetchTrendingTopics();
    fetchResearchAreas();

    return () => subscription.unsubscribe();
  }, []);

  const fetchTrendingTopics = async () => {
    const { data: posts } = await supabase
      .from("research_posts")
      .select("tags");

    if (posts) {
      const tagCount: { [key: string]: number } = {};
      posts.forEach(post => {
        post.tags?.forEach((tag: string) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      });

      const trending = Object.entries(tagCount)
        .map(([name, count]) => ({
          name,
          count,
          trend: `+${Math.floor(Math.random() * 50)}%`
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setTrendingTopics(trending);
    }
  };

  const fetchResearchAreas = async () => {
    setLoading(true);
    const { data: areas, error } = await supabase
      .from("research_areas")
      .select("*");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load research areas",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const areasWithStats = await Promise.all(
      (areas || []).map(async (area) => {
        const { count: followers } = await supabase
          .from("research_area_follows")
          .select("*", { count: "exact", head: true })
          .eq("research_area_id", area.id);

        const { count: papers } = await supabase
          .from("research_posts")
          .select("*", { count: "exact", head: true })
          .contains("tags", [area.title]);

        let isFollowing = false;
        if (currentUser) {
          const { data } = await supabase
            .from("research_area_follows")
            .select("id")
            .eq("research_area_id", area.id)
            .eq("user_id", currentUser.id)
            .single();
          isFollowing = !!data;
        }

        return {
          id: area.id,
          title: area.title,
          description: area.description,
          followers: followers || 0,
          papers: papers || 0,
          isFollowing,
        };
      })
    );

    setResearchAreas(areasWithStats);
    setLoading(false);
  };

  const handleFollow = async (areaId: string) => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow research areas",
      });
      return;
    }

    const area = researchAreas.find(a => a.id === areaId);
    if (!area) return;

    if (area.isFollowing) {
      const { error } = await supabase
        .from("research_area_follows")
        .delete()
        .eq("research_area_id", areaId)
        .eq("user_id", currentUser.id);

      if (!error) {
        setResearchAreas(prev =>
          prev.map(a =>
            a.id === areaId
              ? { ...a, isFollowing: false, followers: a.followers - 1 }
              : a
          )
        );
      }
    } else {
      const { error } = await supabase
        .from("research_area_follows")
        .insert({ research_area_id: areaId, user_id: currentUser.id });

      if (!error) {
        setResearchAreas(prev =>
          prev.map(a =>
            a.id === areaId
              ? { ...a, isFollowing: true, followers: a.followers + 1 }
              : a
          )
        );
      } else {
        toast({
          title: "Error",
          description: "Failed to follow area",
          variant: "destructive",
        });
      }
    }
  };
  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Explore Research</h1>
            <p className="text-muted-foreground text-lg">
              Discover trending topics and groundbreaking research across all disciplines
            </p>
          </div>

          {/* Trending Topics */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <span>Trending Topics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : trendingTopics.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No trending topics yet</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {trendingTopics.map((topic, index) => (
                    <Card key={index} className="hover:shadow-card-hover transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-foreground">{topic.name}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{topic.count} posts</span>
                            <Badge variant="outline" className="text-verified">
                              {topic.trend}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Research Areas */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span>Popular Research Areas</span>
            </h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {researchAreas.map((area) => (
                  <Card key={area.id} className="shadow-card hover:shadow-card-hover transition-all">
                    <CardHeader>
                      <CardTitle className="text-xl">{area.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{area.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{area.followers}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{area.papers} papers</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={area.isFollowing ? "outline" : "default"}
                          onClick={() => handleFollow(area.id)}
                        >
                          {area.isFollowing ? "Following" : "Follow"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <Card className="bg-gradient-hero text-primary-foreground shadow-elevated">
            <CardContent className="py-12 text-center space-y-4">
              <h2 className="text-3xl font-bold">Join the Conversation</h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Connect with researchers worldwide, share your work, and stay updated on the latest breakthroughs
              </p>
              <Button size="lg" variant="secondary" className="mt-4">
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Explore;

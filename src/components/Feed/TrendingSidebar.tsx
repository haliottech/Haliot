import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const TrendingSidebar = () => {
  const [topics, setTopics] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    fetchTrendingTopics();
  }, []);

  const fetchTrendingTopics = async () => {
    const { data } = await supabase
      .from("research_posts")
      .select("tags");

    if (data) {
      const tagCounts: Record<string, number> = {};
      data.forEach((post) => {
        post.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const sortedTopics = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      setTopics(sortedTopics);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Trending Topics</h3>
      <div className="space-y-3">
        {topics.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trending topics yet</p>
        ) : (
          topics.map((topic, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{topic.name}</p>
              </div>
              <span className="text-xs text-muted-foreground">{topic.count}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default TrendingSidebar;

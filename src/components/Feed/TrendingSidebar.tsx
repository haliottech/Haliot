import { Card } from "@/components/ui/card";
import { TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const TrendingSidebar = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<{ name: string; count: number }[]>([]);
  const [activeRooms, setActiveRooms] = useState<{ id: string; title: string; member_count: number }[]>([]);
  const [visitorCount, setVisitorCount] = useState<number>(0);

  useEffect(() => {
    fetchTrendingTopics();
    fetchActiveRooms();
    fetchVisitorCount();
    incrementVisitorCount();
  }, []);

  const fetchVisitorCount = async () => {
    try {
      // Try to get from a site_stats table, or use a simple counter
      const { data } = await (supabase as any)
        .from("site_stats")
        .select("visitor_count")
        .eq("id", "main")
        .single();
      
      if (data) {
        setVisitorCount(data.visitor_count || 0);
      }
    } catch (error) {
      // If table doesn't exist, we'll use localStorage as fallback
      const stored = localStorage.getItem("haliot_visitor_count");
      if (stored) {
        setVisitorCount(parseInt(stored, 10));
      }
    }
  };

  const incrementVisitorCount = async () => {
    const sessionKey = `haliot_visit_${new Date().toDateString()}`;
    const hasVisitedToday = localStorage.getItem(sessionKey);
    
    if (!hasVisitedToday) {
      localStorage.setItem(sessionKey, "true");
      
      try {
        // Try to increment in database
        const { data: existing } = await (supabase as any)
          .from("site_stats")
          .select("visitor_count")
          .eq("id", "main")
          .single();

        if (existing) {
          await (supabase as any)
            .from("site_stats")
            .update({ visitor_count: (existing.visitor_count || 0) + 1 })
            .eq("id", "main");
        } else {
          // Create if doesn't exist
          await (supabase as any)
            .from("site_stats")
            .insert({ id: "main", visitor_count: 1 });
        }
        
        setVisitorCount((prev) => prev + 1);
      } catch (error) {
        // Fallback to localStorage
        const current = parseInt(localStorage.getItem("haliot_visitor_count") || "0", 10);
        const newCount = current + 1;
        localStorage.setItem("haliot_visitor_count", newCount.toString());
        setVisitorCount(newCount);
      }
    } else {
      // Already visited today, just fetch current count
      fetchVisitorCount();
    }
  };

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

  const fetchActiveRooms = async () => {
    const { data } = await (supabase as any)
      .from("discussion_rooms")
      .select("id, title, member_count")
      .eq("is_active", true)
      .order("member_count", { ascending: false })
      .limit(3);

    if (data) {
      setActiveRooms(data);
    }
  };

  const formatVisitorCount = (count: number): string => {
    return count.toString().padStart(5, '0');
  };

  const renderVisitorCounter = () => {
    const countString = formatVisitorCount(visitorCount);
    const digits = countString.split('');

    return (
      <Card className="p-4 mb-6 border border-border/30 bg-card/30 shadow-sm">
        <div className="flex flex-col items-center gap-2.5">
          <div className="flex items-center justify-center gap-1">
            {digits.map((digit, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 font-semibold text-base rounded-md w-8 h-10 flex items-center justify-center border border-orange-200/50"
              >
                {digit}
              </div>
            ))}
          </div>
          <p className="text-xs font-medium text-muted-foreground">Total Visitors</p>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {renderVisitorCounter()}
      
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

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Active Rooms</h3>
        <div className="space-y-3">
          {activeRooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active rooms yet</p>
          ) : (
            activeRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => navigate(`/room/${room.id}`)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{room.title}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{room.member_count} members</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default TrendingSidebar;

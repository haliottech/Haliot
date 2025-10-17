import { Card } from "@/components/ui/card";
import { TrendingUp, Dna, Microscope, Rocket } from "lucide-react";

const TrendingSidebar = () => {
  const topics = [
    { name: "Quantum Computing", icon: TrendingUp, count: 5 },
    { name: "Genomics", icon: Dna, count: 4 },
    { name: "Genomics", icon: Microscope, count: 3 },
    { name: "Sustainable Tech", icon: Rocket, count: 1 },
  ];

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Trending Topics</h3>
      <div className="space-y-3">
        {topics.map((topic, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-accent/10">
              <topic.icon className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{topic.name}</p>
            </div>
            <span className="text-xs text-muted-foreground">{topic.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TrendingSidebar;

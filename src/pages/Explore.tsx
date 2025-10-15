import Header from "@/components/Layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, BookOpen, Sparkles } from "lucide-react";

const trendingTopics = [
  { name: "AI Ethics", count: 1234, trend: "+23%" },
  { name: "Climate Tech", count: 987, trend: "+45%" },
  { name: "Quantum Computing", count: 756, trend: "+12%" },
  { name: "Behavioral Economics", count: 654, trend: "+34%" },
  { name: "Biotechnology", count: 543, trend: "+19%" },
  { name: "Space Exploration", count: 432, trend: "+28%" },
];

const researchAreas = [
  {
    title: "Artificial Intelligence & Ethics",
    description: "Exploring the intersection of AI development and ethical considerations, including bias, privacy, and societal impact.",
    followers: "12.3K",
    papers: 456,
  },
  {
    title: "Climate Change & Sustainability",
    description: "Research on climate science, renewable energy, carbon capture, and sustainable development strategies.",
    followers: "18.7K",
    papers: 823,
  },
  {
    title: "Healthcare Innovation",
    description: "Advances in medical technology, drug development, telemedicine, and healthcare delivery systems.",
    followers: "15.2K",
    papers: 634,
  },
  {
    title: "Quantum Technologies",
    description: "Quantum computing, cryptography, and sensing technologies that leverage quantum mechanical principles.",
    followers: "8.9K",
    papers: 234,
  },
];

const Explore = () => {
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
            </CardContent>
          </Card>

          {/* Research Areas */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span>Popular Research Areas</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {researchAreas.map((area, index) => (
                <Card key={index} className="shadow-card hover:shadow-card-hover transition-all">
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
                      <Button size="sm">Follow</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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

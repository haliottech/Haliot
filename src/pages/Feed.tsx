import Header from "@/components/Layout/Header";
import ResearchCard from "@/components/Feed/ResearchCard";
import { Button } from "@/components/ui/button";
import { PenSquare } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data
const mockPosts = [
  {
    author: {
      name: "Dr. Sarah Chen",
      affiliation: "MIT - Computer Science",
      verified: true,
      avatar: "",
    },
    title: "Novel Approach to Federated Learning in Healthcare AI",
    summary: "We present a new privacy-preserving framework for training medical AI models across multiple hospitals without sharing patient data. Our method achieves 94% accuracy while maintaining HIPAA compliance and reduces communication overhead by 40% compared to traditional federated learning approaches.",
    tags: ["AI Ethics", "Healthcare", "Privacy", "Machine Learning"],
    stats: {
      endorsements: 234,
      comments: 45,
      shares: 89,
    },
    timestamp: "2 hours ago",
  },
  {
    author: {
      name: "Prof. James Morrison",
      affiliation: "Stanford University - Climate Science",
      verified: true,
      avatar: "",
    },
    title: "Breakthrough in Carbon Capture Efficiency Using Bio-Inspired Materials",
    summary: "Our research demonstrates a 300% improvement in CO2 capture rates using materials inspired by deep-sea organisms. This could revolutionize industrial carbon capture technology and accelerate progress toward net-zero emissions targets.",
    tags: ["Climate Tech", "Sustainability", "Materials Science"],
    stats: {
      endorsements: 567,
      comments: 123,
      shares: 234,
    },
    timestamp: "5 hours ago",
  },
  {
    author: {
      name: "Dr. Amara Okafor",
      affiliation: "Oxford University - Behavioral Economics",
      verified: true,
      avatar: "",
    },
    title: "How Micro-Incentives Shape Long-Term Saving Behavior in Low-Income Communities",
    summary: "A 3-year field study across 12 communities reveals that small, frequent rewards increase savings rates by 156% compared to traditional approaches. Our findings challenge conventional wisdom about financial literacy programs and suggest new policy directions.",
    tags: ["Behavioral Economics", "Policy", "Social Impact"],
    stats: {
      endorsements: 189,
      comments: 67,
      shares: 45,
    },
    timestamp: "1 day ago",
  },
];

const Feed = () => {
  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Create Post CTA */}
          <div className="bg-card rounded-lg shadow-card p-4">
            <Link to="/create">
              <Button className="w-full" variant="outline" size="lg">
                <PenSquare className="h-5 w-5 mr-2" />
                Share your research or insights...
              </Button>
            </Link>
          </div>

          {/* Filter/Sort Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">Latest</Button>
              <Button variant="ghost" size="sm">Trending</Button>
              <Button variant="ghost" size="sm">Following</Button>
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-6">
            {mockPosts.map((post, index) => (
              <ResearchCard key={index} {...post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Feed;

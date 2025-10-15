import Header from "@/components/Layout/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResearchCard from "@/components/Feed/ResearchCard";
import { BadgeCheck, MapPin, Link as LinkIcon, Users } from "lucide-react";

const Profile = () => {
  // Mock profile data
  const profile = {
    name: "Dr. Sarah Chen",
    affiliation: "MIT - Computer Science",
    verified: true,
    location: "Cambridge, MA",
    bio: "AI researcher focusing on privacy-preserving machine learning and federated learning systems. Passionate about making AI safer and more accessible for healthcare applications.",
    website: "sarahchen.ai",
    expertise: ["Machine Learning", "AI Ethics", "Healthcare AI", "Privacy"],
    stats: {
      followers: 2456,
      following: 342,
      endorsements: 1234,
      publications: 45,
    },
  };

  const publications = [
    {
      author: {
        name: "Dr. Sarah Chen",
        affiliation: "MIT - Computer Science",
        verified: true,
      },
      title: "Novel Approach to Federated Learning in Healthcare AI",
      summary: "We present a new privacy-preserving framework for training medical AI models across multiple hospitals without sharing patient data.",
      tags: ["AI Ethics", "Healthcare", "Privacy"],
      stats: {
        endorsements: 234,
        comments: 45,
        shares: 89,
      },
      timestamp: "2 hours ago",
    },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Profile Header */}
          <div className="bg-card rounded-lg shadow-card p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-32 w-32">
                <AvatarImage src="" />
                <AvatarFallback className="text-3xl">SC</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h1 className="text-3xl font-bold text-foreground">{profile.name}</h1>
                    {profile.verified && (
                      <BadgeCheck className="h-6 w-6 text-verified" />
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground">{profile.affiliation}</p>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <LinkIcon className="h-4 w-4" />
                    <a href={`https://${profile.website}`} className="text-primary hover:underline">
                      {profile.website}
                    </a>
                  </div>
                </div>

                <p className="text-foreground leading-relaxed">{profile.bio}</p>

                <div className="flex flex-wrap gap-2">
                  {profile.expertise.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-4 pt-2">
                  <Button>
                    <Users className="h-4 w-4 mr-2" />
                    Follow
                  </Button>
                  <Button variant="outline">Message</Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{profile.stats.followers}</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{profile.stats.following}</div>
                <div className="text-sm text-muted-foreground">Following</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{profile.stats.endorsements}</div>
                <div className="text-sm text-muted-foreground">Endorsements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{profile.stats.publications}</div>
                <div className="text-sm text-muted-foreground">Publications</div>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="research" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="research">Research</TabsTrigger>
              <TabsTrigger value="discussions">Discussions</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            <TabsContent value="research" className="space-y-6 mt-6">
              <div className="text-center py-12 text-muted-foreground">
                Your research posts will appear here
              </div>
            </TabsContent>
            <TabsContent value="discussions" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                Discussion threads will appear here
              </div>
            </TabsContent>
            <TabsContent value="about" className="mt-6">
              <div className="bg-card rounded-lg shadow-card p-6">
                <h3 className="text-xl font-bold mb-4">About</h3>
                <p className="text-muted-foreground">{profile.bio}</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;

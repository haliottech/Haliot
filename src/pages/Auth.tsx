import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const Auth = () => {
  const [userType, setUserType] = useState<"researcher" | "student" | "public">("researcher");

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="h-12 w-12 rounded-lg bg-primary-foreground"></div>
            <span className="text-3xl font-bold text-primary-foreground">Haliot</span>
          </Link>
          <p className="text-primary-foreground/90 text-lg">
            Where research meets collaboration
          </p>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Welcome to Haliot</CardTitle>
            <CardDescription>Join the global research community</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@university.edu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" />
                </div>
                <Button className="w-full" size="lg">Sign In</Button>
                <div className="text-center">
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label>I am a...</Label>
                  <div className="flex gap-2">
                    <Badge
                      variant={userType === "researcher" ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2"
                      onClick={() => setUserType("researcher")}
                    >
                      Researcher
                    </Badge>
                    <Badge
                      variant={userType === "student" ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2"
                      onClick={() => setUserType("student")}
                    >
                      Student
                    </Badge>
                    <Badge
                      variant={userType === "public" ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2"
                      onClick={() => setUserType("public")}
                    >
                      Enthusiast
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Dr. Jane Smith" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="you@university.edu" />
                  {userType === "researcher" && (
                    <p className="text-xs text-muted-foreground">
                      Use your institutional email for automatic verification
                    </p>
                  )}
                </div>

                {userType === "researcher" && (
                  <div className="space-y-2">
                    <Label htmlFor="affiliation">Affiliation</Label>
                    <Input id="affiliation" placeholder="University / Institution" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" />
                </div>

                <Button className="w-full" size="lg">Create Account</Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;

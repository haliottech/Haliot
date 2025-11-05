import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { User, Award, AlertCircle } from "lucide-react";

const ProfileSidebar = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
    fetchSuggestedUsers();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    
    if (session?.user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      setProfile(data);
    }
    setLoading(false);
  };

  const fetchSuggestedUsers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", session.user.id)
        .limit(2);
      
      if (data) {
        setSuggestedUsers(data);
      }
    }
  };

  if (loading) return null;

  // For logged-in users
  if (user && profile) {
    const initials = profile.full_name?.split(' ').map((n: string) => n[0]).join('') || 
                     profile.email?.charAt(0).toUpperCase() || 'U';

    const completionScore = profile.profile_completion_score || 0;
    const isProfileComplete = completionScore >= 80;

    return (
      <Card className="p-8 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="text-center">
          <Link to="/profile">
            <Avatar className="h-24 w-24 mx-auto mb-4 bg-accent/20 cursor-pointer hover:ring-4 hover:ring-primary/30 transition-all border-2 border-border/50">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
              ) : (
                <AvatarFallback className="text-3xl bg-accent/20 text-accent">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
          
          <Link to="/profile">
            <h4 className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer mb-1">{profile.full_name || 'User'}</h4>
          </Link>
          <p className="text-sm text-muted-foreground mb-3">
            {profile.affiliation || 'No affiliation'}
          </p>
          
          {/* Subtle Profile Completion Reminder */}
          {!isProfileComplete && (
            <div className="mb-4">
              <Link to="/profile">
                <Badge variant="outline" className="text-xs py-1 px-2 cursor-pointer hover:bg-muted/50 transition-colors border-dashed">
                  <User className="h-3 w-3 mr-1" />
                  Complete profile
                </Badge>
              </Link>
            </div>
          )}

          {/* Profile Completion Badge */}
          {isProfileComplete && (
            <div className="mb-4">
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                <Award className="h-3 w-3 mr-1" />
                Complete Profile
              </Badge>
            </div>
          )}

          <div className="flex justify-center gap-6 text-sm mb-6 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">0</div>
              <div className="text-xs text-muted-foreground mt-0.5">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">0</div>
              <div className="text-xs text-muted-foreground mt-0.5">Following</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">{completionScore}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Score</div>
            </div>
          </div>
          
          <Link to="/profile">
            <Button variant="outline" className="w-full" size="lg">
              Edit Profile
            </Button>
          </Link>
        </div>

        <div className="border-t border-border/50 pt-6 mt-6">
          <h4 className="font-semibold mb-4 text-base">Suggested Connections</h4>
          <div className="space-y-3">
            {suggestedUsers.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                <Avatar className="h-8 w-8 bg-muted">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
                  ) : (
                    <AvatarFallback className="text-xs">
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || 'R'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{user.full_name || user.email}</p>
                  {user.affiliation && (
                    <p className="text-xs text-muted-foreground">{user.affiliation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // For non-logged-in users
  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h3 className="font-semibold mb-4">Join Haliothub Connect</h3>
        
        <div className="mb-4 p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-center mb-3">
            <div className="p-3 bg-gradient-primary rounded-full shadow-gold">
              <User className="h-6 w-6 text-white" />
            </div>
          </div>
          <h4 className="font-semibold mb-2">Connect with Researchers</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Join our community of researchers, academics, and professionals to share knowledge and collaborate.
          </p>
        </div>

        
        <Link to="/auth">
          <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-gold font-semibold">
            Get Started
          </Button>
        </Link>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3 text-sm">Featured Researchers</h4>
        <div className="space-y-3">
          {suggestedUsers.slice(0, 2).map((user) => (
            <div 
              key={user.id} 
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate('/auth')}
            >
              <Avatar className="h-8 w-8 bg-muted">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
                ) : (
                  <AvatarFallback className="text-xs">
                    {user.full_name?.charAt(0) || user.email?.charAt(0) || 'R'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 text-sm">
                <p className="font-medium">{user.full_name || user.email}</p>
                {user.affiliation && (
                  <p className="text-xs text-muted-foreground">{user.affiliation}</p>
                )}
              </div>
            </div>
          ))}
          
          {suggestedUsers.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">Sign up to see featured researchers</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProfileSidebar;

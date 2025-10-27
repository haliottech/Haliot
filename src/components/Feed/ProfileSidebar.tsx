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

  useEffect(() => {
    fetchProfile();
    fetchSuggestedUsers();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
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

  if (loading || !profile) return null;

  const initials = profile.full_name?.split(' ').map((n: string) => n[0]).join('') || 
                   profile.email?.charAt(0).toUpperCase() || 'U';

  const completionScore = profile.profile_completion_score || 0;
  const isProfileComplete = completionScore >= 80;

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h3 className="font-semibold mb-4">Your Profile</h3>
        
        {/* Profile Completion Alert */}
        {!isProfileComplete && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Complete Your Profile</span>
            </div>
            <Progress value={completionScore} className="h-2 mb-2" />
            <p className="text-xs text-orange-600">
              {completionScore}% complete - Add more details to improve visibility
            </p>
          </div>
        )}

        <Avatar className="h-20 w-20 mx-auto mb-3 bg-accent/20">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
          ) : (
            <AvatarFallback className="text-2xl bg-accent/20 text-accent">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        
        <h4 className="font-semibold">{profile.full_name || 'User'}</h4>
        <p className="text-sm text-muted-foreground mb-2">
          {profile.affiliation || 'No affiliation'}
        </p>
        
        {profile.profession && (
          <p className="text-sm text-muted-foreground mb-2">
            {profile.profession}
          </p>
        )}

        {/* Profile Completion Badge */}
        <div className="mb-4">
          {isProfileComplete ? (
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
              <Award className="h-3 w-3 mr-1" />
              Complete Profile
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
              <User className="h-3 w-3 mr-1" />
              {completionScore}% Complete
            </Badge>
          )}
        </div>

        <div className="flex justify-center gap-6 text-sm mb-4">
          <div>
            <span className="font-semibold">0</span>
            <p className="text-muted-foreground">Followers</p>
          </div>
          <div>
            <span className="font-semibold">0</span>
            <p className="text-muted-foreground">Following</p>
          </div>
          <div>
            <span className="font-semibold">{completionScore}</span>
            <p className="text-muted-foreground">Profile Score</p>
          </div>
        </div>
        
        <Link to="/profile">
          <Button variant="outline" className="w-full">
            Edit Profile
          </Button>
        </Link>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3 text-sm">Suggested Connections</h4>
        <div className="space-y-3">
          {suggestedUsers.map((user) => (
            <div 
              key={user.id} 
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate('/chat')}
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
};

export default ProfileSidebar;

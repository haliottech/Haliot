import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";

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

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h3 className="font-semibold mb-4">Your Profile</h3>
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
        <p className="text-sm text-muted-foreground mb-4">
          {profile.affiliation || 'No affiliation'}
        </p>
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
            <span className="font-semibold">0</span>
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

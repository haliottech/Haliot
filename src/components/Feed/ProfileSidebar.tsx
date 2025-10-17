import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const ProfileSidebar = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
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

  if (loading || !profile) return null;

  const initials = profile.full_name?.split(' ').map((n: string) => n[0]).join('') || 
                   profile.email?.charAt(0).toUpperCase() || 'U';

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h3 className="font-semibold mb-4">Your Profile</h3>
        <Avatar className="h-20 w-20 mx-auto mb-3 bg-accent/20">
          <AvatarFallback className="text-2xl bg-accent/20 text-accent">
            {initials}
          </AvatarFallback>
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
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Avatar className="h-8 w-8 bg-muted">
                <AvatarFallback className="text-xs">R</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-sm">
                <p className="font-medium">Researcher {i}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ProfileSidebar;

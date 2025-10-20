import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlaskConical, MessageSquare, Compass } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationDropdown from "@/components/Notifications/NotificationDropdown";

const Header = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-accent/10 rounded">
              <FlaskConical className="h-5 w-5 text-accent" />
            </div>
            <span className="text-lg font-bold text-foreground">Haliot Research</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link to="/explore" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Compass className="h-5 w-5" />
              <span className="font-medium">Explore</span>
            </Link>
            <Link to="/chat" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <MessageSquare className="h-5 w-5" />
              <span className="font-medium">Messages</span>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {user && <NotificationDropdown />}
            {user ? (
              <Link to="/profile" className="flex items-center gap-2">
                <span className="text-sm">Hi, {profile?.full_name?.split(' ')[0] || 'User'}!</span>
                <Avatar className="h-8 w-8 bg-accent/20">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt="Avatar" />
                  ) : (
                    <AvatarFallback className="bg-accent/20 text-accent text-xs">
                      {getInitials(profile?.full_name, profile?.email)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

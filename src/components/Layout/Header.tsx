import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlaskConical, MessageSquare, Compass, Plus } from "lucide-react";
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
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="p-1.5 bg-gradient-primary rounded-lg shadow-gold">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Haliot</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link to="/explore" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium">
              <Compass className="h-5 w-5" />
              <span>Explore</span>
            </Link>
            <Link to="/chat" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium">
              <MessageSquare className="h-5 w-5" />
              <span>Messages</span>
            </Link>
            {user && (
              <Link to="/create">
                <Button size="sm" className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity shadow-gold">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Share New Research</span>
                  <span className="sm:hidden">Share</span>
                </Button>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user && <NotificationDropdown />}
            {user ? (
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                <span className="text-sm font-medium">{profile?.full_name?.split(' ')[0] || 'User'}</span>
                <Avatar className="h-9 w-9 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt="Avatar" />
                  ) : (
                    <AvatarFallback className="bg-gradient-primary text-white text-xs font-semibold">
                      {getInitials(profile?.full_name, profile?.email)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-gold">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

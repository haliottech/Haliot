import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlaskConical, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
          
          <div className="text-lg font-semibold text-foreground">
            Haliot Research Social Feed
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </button>
            {user ? (
              <Link to="/profile" className="flex items-center gap-2">
                <span className="text-sm">Hi, User!</span>
                <Avatar className="h-8 w-8 bg-accent/20">
                  <AvatarFallback className="bg-accent/20 text-accent text-xs">
                    U
                  </AvatarFallback>
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

import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlaskConical, PenSquare, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const Header = () => {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isHomePage = location.pathname === "/";

  return (
    <>
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <FlaskConical className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">Haliot</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors">
                Home
              </Link>
              <Link to="/explore" className="text-foreground/80 hover:text-foreground transition-colors">
                Explore
              </Link>
              {user && (
                <>
                  <Link to="/dashboard" className="text-foreground/80 hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/profile" className="text-foreground/80 hover:text-foreground transition-colors">
                    Profile
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link to="/create">
                    <Button className="gap-2">
                      <PenSquare className="h-4 w-4" />
                      Create Post
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="outline" className="gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/auth">
                  <Button>Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {isHomePage && (
        <section className="bg-gradient-primary text-white py-20">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h1 className="text-5xl font-bold mb-6">Connect. Collaborate. Accelerate Research.</h1>
            <p className="text-xl mb-8 text-white/90">
              Haliot brings researchers together to share discoveries, find opportunities, and build the future of science.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" variant="secondary">
                  Get Started
                </Button>
              </Link>
              <Link to="/explore">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Explore Research
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {isHomePage && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FlaskConical className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Share Research</h3>
                <p className="text-muted-foreground">
                  Post summaries of your work, findings, and projects to connect with the research community.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PenSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Engage & Discuss</h3>
                <p className="text-muted-foreground">
                  Like, comment, and discuss research with peers across disciplines and institutions.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LayoutDashboard className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Build Your Profile</h3>
                <p className="text-muted-foreground">
                  Showcase your expertise, track your contributions, and grow your research network.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Header;

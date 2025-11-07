import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlaskConical, MessageSquare, Compass, Plus, Home, Search, ChevronDown, FileText, User, Users } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationDropdown from "@/components/Notifications/NotificationDropdown";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchResult {
  id: string;
  type: 'post' | 'user' | 'room';
  title: string;
  subtitle?: string;
  avatar?: string;
}

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const navigationItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/explore", label: "Explore", icon: Compass },
    { path: "/chat", label: "Messages", icon: MessageSquare },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];

    try {
      // Search Posts
      const { data: posts } = await supabase
        .from("research_posts")
        .select("id, title, summary, tags")
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
        .limit(5);

      if (posts) {
        posts.forEach((post: any) => {
          results.push({
            id: post.id,
            type: 'post',
            title: post.title,
            subtitle: post.summary?.substring(0, 60) + (post.summary?.length > 60 ? '...' : ''),
          });
        });
      }

      // Search Users
      const { data: users } = await supabase
        .from("profiles")
        .select("id, full_name, email, affiliation, avatar_url")
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,affiliation.ilike.%${query}%`)
        .limit(5);

      if (users) {
        users.forEach((user: any) => {
          results.push({
            id: user.id,
            type: 'user',
            title: user.full_name || user.email || 'Unknown',
            subtitle: user.affiliation,
            avatar: user.avatar_url,
          });
        });
      }

      // Search Rooms
      const { data: rooms } = await (supabase.from("discussion_rooms") as any)
        .select("id, title, description, topic")
        .eq("is_active", true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,topic.ilike.%${query}%`)
        .limit(5);

      if (rooms) {
        rooms.forEach((room: any) => {
          results.push({
            id: room.id,
            type: 'room',
            title: room.title,
            subtitle: room.description || room.topic,
          });
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      setIsSearchOpen(true);
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchResultClick = (result: SearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    
    if (result.type === 'post') {
      navigate('/');
      // Scroll to post if needed
      setTimeout(() => {
        const element = document.getElementById(`post-${result.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else if (result.type === 'user') {
      navigate(`/profile/${result.id}`);
    } else if (result.type === 'room') {
      navigate(`/room/${result.id}`);
    }
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left Section: Logo + Search */}
          <div className="flex items-center gap-4 flex-1">
            {/* Logo */}
            <Link to="/" className="flex items-center hover:opacity-90 transition-opacity flex-shrink-0">
              <div className="p-1.5 bg-gradient-primary rounded-lg shadow-gold">
                <FlaskConical className="h-6 w-6 text-white" />
              </div>
            </Link>
            
            {/* Search Bar */}
            <Popover open={isSearchOpen && (searchQuery.trim().length > 0 || searchResults.length > 0)} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                <div className="relative max-w-md w-full hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search posts, users, rooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim() || searchResults.length > 0) {
                        setIsSearchOpen(true);
                      }
                    }}
                    className="pl-10 h-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 rounded-md"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[var(--radix-popover-trigger-width)] p-0" 
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="max-h-[400px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : searchResults.length === 0 && searchQuery.trim() ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No results found
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((result) => {
                        const Icon = result.type === 'post' ? FileText : result.type === 'user' ? User : Users;
                        return (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleSearchResultClick(result)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="flex-shrink-0">
                              {result.type === 'user' && result.avatar ? (
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={result.avatar} alt={result.title} />
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {result.title.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-foreground truncate">
                                {result.title}
                              </div>
                              {result.subtitle && (
                                <div className="text-xs text-muted-foreground truncate mt-0.5">
                                  {result.subtitle}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1 capitalize">
                                {result.type}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right Section: Navigation + Create + Notifications + Profile */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Navigation Items */}
            <nav className="flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative flex flex-col items-center justify-center min-w-[80px] px-3 py-1.5 hover:bg-muted/50 rounded transition-colors group"
                  >
                    <Icon className={`h-6 w-6 mb-0.5 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    <span className={`text-xs ${active ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-primary'}`}>
                      {item.label}
                    </span>
                    {active && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {user && (
              <>
                {/* Create Button - Icon Only */}
                <Link
                  to="/create"
                  className="flex items-center justify-center w-10 h-10 hover:bg-muted/50 rounded transition-colors group"
                  title="Create"
                >
                  <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </Link>

                {/* Notifications - Icon Only */}
                <NotificationDropdown />

                {/* Profile */}
                <Link
                  to="/profile"
                  className="flex items-center justify-center w-10 h-10 hover:bg-muted/50 rounded transition-colors group relative"
                  title="Profile"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                    {profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt="Avatar" className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gradient-primary text-white text-xs font-semibold">
                        {getInitials(profile?.full_name, profile?.email)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <ChevronDown className="absolute -bottom-1 -right-1 h-3 w-3 text-muted-foreground group-hover:text-primary bg-background rounded-full" />
                </Link>
              </>
            )}
            {!user && (
              <Link to="/auth">
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-gold font-semibold">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

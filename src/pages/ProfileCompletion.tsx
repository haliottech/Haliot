import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { User } from "@supabase/supabase-js";
import { Camera, Award, Linkedin, GraduationCap, BookOpen, X } from "lucide-react";

const ProfileCompletion = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [domainExpertise, setDomainExpertise] = useState<string[]>([]);
  const [newExpertise, setNewExpertise] = useState("");
  const [publications, setPublications] = useState<Array<{title: string, year: string, link?: string}>>([]);
  const [newPublication, setNewPublication] = useState({ title: "", year: "", link: "" });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchProfile(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
      setDomainExpertise(data.domain_expertise || []);
      setPublications(data.publication_history || []);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile photo updated!",
      });

      fetchProfile(user.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !domainExpertise.includes(newExpertise.trim())) {
      setDomainExpertise([...domainExpertise, newExpertise.trim()]);
      setNewExpertise("");
    }
  };

  const removeExpertise = (expertise: string) => {
    setDomainExpertise(domainExpertise.filter(e => e !== expertise));
  };

  const addPublication = () => {
    if (newPublication.title.trim() && newPublication.year.trim()) {
      setPublications([...publications, { ...newPublication }]);
      setNewPublication({ title: "", year: "", link: "" });
    }
  };

  const removePublication = (index: number) => {
    setPublications(publications.filter((_, i) => i !== index));
  };

  const handleCompleteProfile = async () => {
    if (!user) return;

    // Validate required fields
    if (!profile?.full_name || !profile?.affiliation || !profile?.bio || domainExpertise.length === 0) {
      toast({
        title: "Incomplete Profile",
        description: "Please fill in all required fields: Full Name, Affiliation, Bio, and at least one Domain Expertise.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        affiliation: profile.affiliation,
        bio: profile.bio,
        domain_expertise: domainExpertise,
        linkedin_url: profile.linkedin_url,
        publication_history: publications,
        profile_completed: true,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to complete profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Your profile has been completed!",
      });
      navigate("/");
    }
  };

  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 
                   profile?.email?.charAt(0).toUpperCase() || 'U';

  if (!user || !profile) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="p-8 shadow-elevated border-border/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
              <Award className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Complete Your Researcher Profile
            </h1>
            <p className="text-muted-foreground">
              Create your academic identity to connect with other researchers
            </p>
          </div>

          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className="h-32 w-32 bg-accent/20">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
                  ) : (
                    <AvatarFallback className="text-4xl bg-accent/20 text-accent">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                  <Camera className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={profile?.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Dr. Jane Smith"
                required
              />
            </div>

            {/* Affiliation */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Affiliation <span className="text-destructive">*</span>
              </label>
              <Input
                value={profile?.affiliation || ""}
                onChange={(e) => setProfile({ ...profile, affiliation: e.target.value })}
                placeholder="University of Science, Department of Computer Science"
                required
              />
            </div>

            {/* Domain Expertise */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Domain Expertise <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newExpertise}
                  onChange={(e) => setNewExpertise(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                  placeholder="e.g., Machine Learning, Quantum Computing"
                />
                <Button type="button" onClick={addExpertise} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {domainExpertise.map((exp, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {exp}
                    <button
                      onClick={() => removeExpertise(exp)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Bio <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={profile?.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about your research interests, background, and goals..."
                rows={4}
                required
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-medium mb-2">
                LinkedIn Profile URL
              </label>
              <Input
                value={profile?.linkedin_url || ""}
                onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            {/* Publication History */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Publication History
              </label>
              <div className="space-y-2 mb-2 border p-4 rounded-lg">
                <Input
                  placeholder="Publication Title"
                  value={newPublication.title}
                  onChange={(e) => setNewPublication({ ...newPublication, title: e.target.value })}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Year"
                    value={newPublication.year}
                    onChange={(e) => setNewPublication({ ...newPublication, year: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Link (optional)"
                    value={newPublication.link}
                    onChange={(e) => setNewPublication({ ...newPublication, link: e.target.value })}
                    className="flex-2"
                  />
                  <Button type="button" onClick={addPublication} variant="outline">
                    Add
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {publications.map((pub, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{pub.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {pub.year} {pub.link && <a href={pub.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View</a>}
                      </p>
                    </div>
                    <button
                      onClick={() => removePublication(idx)}
                      className="ml-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleCompleteProfile}
                className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity shadow-gold font-semibold"
              >
                Complete Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="flex-1"
              >
                Skip for Now
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfileCompletion;


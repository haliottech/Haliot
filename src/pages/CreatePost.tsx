import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CreatePost = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [fullTextLink, setFullTextLink] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to create a post",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !summary.trim()) {
      toast({
        title: "Error",
        description: "Title and summary are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    let documentUrl = null;

    // Upload file if present
    if (uploadedFile) {
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('research-documents')
        .upload(filePath, uploadedFile);

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        toast({
          title: "Error",
          description: "Failed to upload document",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('research-documents')
        .getPublicUrl(filePath);

      documentUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("research_posts")
      .insert({
        user_id: user.id,
        title: title.trim(),
        summary: summary.trim(),
        full_text_link: fullTextLink.trim() || null,
        document_url: documentUrl,
        tags,
        visibility,
      });

    if (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Your research post has been published",
      });
      navigate("/");
    }

    setLoading(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-2xl">Share Your Research</CardTitle>
              <p className="text-muted-foreground">
                Share insights, findings, or updates with the Haliot community
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your research a clear, descriptive title"
                    className="text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Summary *</Label>
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Provide a concise summary of your research. Focus on key findings, methodology, and implications..."
                    rows={8}
                    className="resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link">Full Paper Link (Optional)</Label>
                  <Input
                    id="link"
                    type="url"
                    value={fullTextLink}
                    onChange={(e) => setFullTextLink(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document">Upload Document (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <label htmlFor="document" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Choose File</span>
                      </div>
                      <input
                        id="document"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {uploadedFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{uploadedFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setUploadedFile(null)}
                          className="hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, or TXT (max 10MB)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Research Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add tags (e.g., AI Ethics, Climate Tech)"
                    />
                    <Button type="button" onClick={addTag}>Add</Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="pl-3 pr-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:bg-muted rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={visibility === "public"}
                        onChange={(e) => setVisibility(e.target.value)}
                      />
                      <span className="text-sm">Public (visible to everyone)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        value="academic"
                        checked={visibility === "academic"}
                        onChange={(e) => setVisibility(e.target.value)}
                      />
                      <span className="text-sm">Academic only</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                    {loading ? "Publishing..." : "Publish Research"}
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreatePost;

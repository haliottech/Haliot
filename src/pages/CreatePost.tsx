import Header from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";

const CreatePost = () => {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl">Share Your Research</CardTitle>
              <p className="text-muted-foreground">
                Share insights, findings, or updates with the Haliot community
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Give your research a clear, descriptive title"
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Provide a concise summary of your research (max 300 words). Focus on key findings, methodology, and implications..."
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">0 / 300 words</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Full Paper Link (Optional)</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://..."
                />
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
                    <input type="radio" name="visibility" defaultChecked />
                    <span className="text-sm">Public (visible to everyone)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="visibility" />
                    <span className="text-sm">Academic only (verified researchers)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Collaboration Status</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" />
                    <span className="text-sm">Open to collaboration</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" />
                    <span className="text-sm">Seeking feedback</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button size="lg" className="flex-1">Publish Research</Button>
                <Button size="lg" variant="outline">Save Draft</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreatePost;

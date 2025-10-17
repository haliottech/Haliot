import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface ResearchCardProps {
  id: string;
  author: string;
  authorAffiliation?: string;
  title: string;
  summary: string;
  tags: string[];
  timeAgo: string;
  userId?: string;
}

const ResearchCard = ({ id, author, authorAffiliation, title, summary, tags, timeAgo, userId }: ResearchCardProps) => {
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    fetchLikes();
    fetchComments();

    return () => subscription.unsubscribe();
  }, [id]);

  const fetchLikes = async () => {
    const { data, error } = await supabase
      .from("likes")
      .select("*")
      .eq("post_id", id);

    if (!error && data) {
      setLikesCount(data.length);
      if (currentUser) {
        setIsLiked(data.some((like) => like.user_id === currentUser.id));
      }
    }
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        profiles!comments_user_id_fkey (full_name, email)
      `)
      .eq("post_id", id)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCommentsCount(data.length);
      setComments(data);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
      });
      return;
    }

    if (isLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", id)
        .eq("user_id", currentUser.id);

      if (!error) {
        setIsLiked(false);
        setLikesCount(likesCount - 1);
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ post_id: id, user_id: currentUser.id });

      if (!error) {
        setIsLiked(true);
        setLikesCount(likesCount + 1);
      } else {
        toast({
          title: "Error",
          description: "Failed to like post",
          variant: "destructive",
        });
      }
    }
  };

  const handleComment = async () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
      });
      return;
    }

    if (!newComment.trim()) return;

    const { error } = await supabase
      .from("comments")
      .insert({
        post_id: id,
        user_id: currentUser.id,
        content: newComment,
      });

    if (!error) {
      setNewComment("");
      fetchComments();
      toast({
        title: "Success",
        description: "Comment posted",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 glass-card hover:shadow-elegant transition-all">
      <div className="flex gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback>{author.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="mb-2">
            <h3 className="font-semibold text-lg">{author}</h3>
            {authorAffiliation && (
              <p className="text-sm text-muted-foreground">{authorAffiliation}</p>
            )}
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>

          <h2 className="text-xl font-bold mb-2 text-foreground">{title}</h2>
          <p className="text-muted-foreground mb-4">{summary}</p>

          <div className="flex gap-2 mb-4 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-border/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`gap-2 ${isLiked ? "text-accent" : ""}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              {likesCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {commentsCount}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t border-border/40">
              {currentUser && (
                <div className="mb-4">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-2"
                  />
                  <Button onClick={handleComment} size="sm">
                    Post Comment
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {(comment.profiles?.full_name || comment.profiles?.email)?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {comment.profiles?.full_name || comment.profiles?.email}
                      </p>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ResearchCard;

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageCircle, Bookmark, UserPlus } from "lucide-react";
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
        profiles (full_name, email)
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
    <Card className="p-5 hover:shadow-card-hover transition-all">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 bg-muted">
          <AvatarFallback className="text-sm">{author.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{author}</h3>
                {authorAffiliation && (
                  <span className="text-xs text-muted-foreground">({authorAffiliation})</span>
                )}
              </div>
              <Badge variant="secondary" className="text-xs bg-accent/20 text-accent border-0 mt-1">
                ACTIVE
              </Badge>
            </div>
          </div>

          <h2 className="text-base font-bold mb-2 text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{summary}</p>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 hover:text-accent transition-colors ${
                  isLiked ? "text-accent" : "text-muted-foreground"
                }`}
              >
                <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                <span>{likesCount} Likes</span>
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-accent transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{commentsCount} Endorse ({commentsCount} Credit)</span>
              </button>
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-accent transition-colors">
                <Bookmark className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
            <Button size="sm" className="bg-accent hover:bg-accent/90 gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Connect
            </Button>
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t border-border">
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

              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="h-7 w-7 bg-muted">
                      <AvatarFallback className="text-xs">
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

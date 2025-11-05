import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageCircle, Bookmark, UserPlus, FileText, Edit, Trash2, BarChart3, MoreVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, Link } from "react-router-dom";
import { createLikeNotification } from "@/utils/notifications";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ResearchCardProps {
  id: string;
  author: string;
  authorAffiliation?: string;
  authorAvatar?: string;
  title: string;
  summary: string;
  tags: string[];
  timeAgo: string;
  userId?: string;
  documentUrl?: string;
}

const ResearchCard = ({ id, author, authorAffiliation, authorAvatar, title, summary, tags, timeAgo, userId, documentUrl }: ResearchCardProps) => {
  const navigate = useNavigate();
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editSummary, setEditSummary] = useState(summary);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchCurrentUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchCurrentUserProfile(session.user.id);
      }
    });

    fetchLikes();
    fetchComments();
    fetchAnalytics();

    return () => subscription.unsubscribe();
  }, [id]);

  const fetchCurrentUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    
    if (data) {
      setCurrentUserProfile(data);
    }
  };

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
        
        // Create notification for post owner if it's not their own post
        if (userId && userId !== currentUser.id && currentUserProfile?.full_name) {
          setTimeout(() => {
            createLikeNotification(
              userId,
              currentUserProfile.full_name,
              id,
              currentUser.id
            );
          }, 0);
        }
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

  const fetchAnalytics = async () => {
    if (!currentUser || currentUser.id !== userId) return;
    
    const { data } = await supabase
      .from("post_analytics")
      .select("*")
      .eq("post_id", id)
      .single();
    
    if (data) {
      setAnalytics(data);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditTitle(title);
    setEditSummary(summary);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editSummary.trim()) {
      toast({
        title: "Error",
        description: "Title and summary are required",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("research_posts")
      .update({
        title: editTitle.trim(),
        summary: editSummary.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (!error) {
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Post updated successfully",
      });
      // Refresh the page to show updated content
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    const { error } = await supabase
      .from("research_posts")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      // Refresh the page to remove the deleted post
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const handleConnect = () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to connect",
      });
      return;
    }
    navigate("/chat");
  };

  return (
    <Card className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <div className="flex gap-5">
        {userId ? (
          <Link to={`/profile/${userId}`}>
            <Avatar className="h-12 w-12 bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all border border-border/50">
              {authorAvatar ? (
                <img src={authorAvatar} alt={author} className="object-cover w-full h-full" />
              ) : (
                <AvatarFallback className="text-base">{author.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
          </Link>
        ) : (
          <Avatar className="h-12 w-12 bg-muted border border-border/50">
          {authorAvatar ? (
            <img src={authorAvatar} alt={author} className="object-cover w-full h-full" />
          ) : (
              <AvatarFallback className="text-base">{author.charAt(0)}</AvatarFallback>
          )}
        </Avatar>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {userId ? (
                  <Link to={`/profile/${userId}`} className="font-semibold text-base hover:text-primary transition-colors cursor-pointer">
                    {author}
                  </Link>
                ) : (
                  <h3 className="font-semibold text-base">{author}</h3>
                )}
                {authorAffiliation && (
                  <span className="text-xs text-muted-foreground">({authorAffiliation})</span>
                )}
              </div>
            </div>
            
            {/* Post owner actions */}
            {currentUser && currentUser.id === userId && (
              <div className="flex items-center gap-2">
                <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Post Analytics</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {analytics ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <div className="text-2xl font-bold text-primary">{analytics.views || 0}</div>
                              <div className="text-sm text-muted-foreground">Views</div>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <div className="text-2xl font-bold text-primary">{analytics.likes_count || 0}</div>
                              <div className="text-sm text-muted-foreground">Likes</div>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <div className="text-2xl font-bold text-primary">{analytics.comments_count || 0}</div>
                              <div className="text-sm text-muted-foreground">Comments</div>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <div className="text-2xl font-bold text-primary">{analytics.shares_count || 0}</div>
                              <div className="text-sm text-muted-foreground">Shares</div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          No analytics data available yet
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                  placeholder="Enter post title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Summary</label>
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm h-20 resize-none"
                  placeholder="Enter post summary"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-3 text-foreground leading-tight">{title}</h2>
              <p className="text-base text-muted-foreground mb-4 leading-relaxed">{summary}</p>
              {tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md border border-border/50 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
          )}

              {/* Document Attachment Indicator */}
              {documentUrl && (
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 inline-flex items-center gap-3 px-3 py-2 border border-border/50 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 hover:border-primary/40 hover:bg-muted/40 transition-all group"
                >
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      Document Attached
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {documentUrl.toLowerCase().endsWith('.pdf') ? 'PDF' : documentUrl.split('.').pop()?.toUpperCase() || 'File'} • Click to view
                    </p>
                  </div>
                  <svg className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </>
          )}

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50">
            <div className="flex items-center gap-6 text-sm">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  isLiked 
                    ? "text-primary bg-primary/10 hover:bg-primary/20" 
                    : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                }`}
              >
                <ThumbsUp className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                <span className="font-medium">{likesCount}</span>
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">{commentsCount}</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors">
                <Bookmark className="h-5 w-5" />
                <span className="font-medium">Save</span>
              </button>
            </div>
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity gap-2 shadow-gold font-medium" onClick={handleConnect}>
              <UserPlus className="h-4 w-4" />
              Connect
            </Button>
          </div>

          {showComments && (
            <div className="mt-6 pt-6 border-t border-border/50">
              {currentUser && (
                <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-3 min-h-[100px] resize-none"
                  />
                  <Button onClick={handleComment} size="lg">
                    Post Comment
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    {comment.user_id ? (
                      <Link to={`/profile/${comment.user_id}`}>
                        <Avatar className="h-10 w-10 bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all border border-border/50">
                          <AvatarFallback className="text-sm">
                            {(comment.profiles?.full_name || comment.profiles?.email)?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <Avatar className="h-10 w-10 bg-muted border border-border/50">
                        <AvatarFallback className="text-sm">
                        {(comment.profiles?.full_name || comment.profiles?.email)?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {comment.user_id ? (
                          <Link to={`/profile/${comment.user_id}`} className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">
                            {comment.profiles?.full_name || comment.profiles?.email}
                          </Link>
                        ) : (
                          <p className="text-sm font-semibold">
                        {comment.profiles?.full_name || comment.profiles?.email}
                      </p>
                        )}
                        <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
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

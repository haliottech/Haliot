import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Share2, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface ResearchCardProps {
  author: {
    name: string;
    affiliation: string;
    verified: boolean;
    avatar?: string;
  };
  title: string;
  summary: string;
  tags: string[];
  stats: {
    endorsements: number;
    comments: number;
    shares: number;
  };
  timestamp: string;
}

const ResearchCard = ({ author, title, summary, tags, stats, timestamp }: ResearchCardProps) => {
  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-300">
      <CardHeader>
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={author.avatar} />
            <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-foreground truncate">{author.name}</h3>
              {author.verified && (
                <BadgeCheck className="h-4 w-4 text-verified flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{author.affiliation}</p>
            <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <h2 className="text-xl font-bold text-foreground leading-tight">{title}</h2>
        <p className="text-muted-foreground leading-relaxed">{summary}</p>
        
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="space-x-2">
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm font-medium">{stats.endorsements}</span>
          </Button>
          <Button variant="ghost" size="sm" className="space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">{stats.comments}</span>
          </Button>
          <Button variant="ghost" size="sm" className="space-x-2">
            <Share2 className="h-4 w-4" />
            <span className="text-sm font-medium">{stats.shares}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ResearchCard;

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Building2 } from "lucide-react";

interface OpportunityCardProps {
  type: "assistantship" | "fellowship" | "collaboration" | "funding";
  title: string;
  institution: string;
  location: string;
  deadline: string;
  fields: string[];
  description: string;
}

const typeColors = {
  assistantship: "bg-primary/10 text-primary",
  fellowship: "bg-accent/10 text-accent",
  collaboration: "bg-verified/10 text-verified",
  funding: "bg-purple-100 text-purple-700",
};

const typeLabels = {
  assistantship: "Research Assistantship",
  fellowship: "Fellowship",
  collaboration: "Collaboration",
  funding: "Funding Call",
};

const OpportunityCard = ({
  type,
  title,
  institution,
  location,
  deadline,
  fields,
  description,
}: OpportunityCardProps) => {
  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Badge className={typeColors[type]}>{typeLabels[type]}</Badge>
          <span className="text-xs text-muted-foreground">Deadline: {deadline}</span>
        </div>
        <h3 className="text-xl font-bold text-foreground mt-3">{title}</h3>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{institution}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Apply by {deadline}</span>
          </div>
        </div>

        <p className="text-muted-foreground line-clamp-3">{description}</p>

        <div className="flex flex-wrap gap-2">
          {fields.map((field, index) => (
            <Badge key={index} variant="outline" className="font-normal">
              {field}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  );
};

export default OpportunityCard;

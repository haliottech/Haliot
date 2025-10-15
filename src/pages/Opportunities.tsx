import Header from "@/components/Layout/Header";
import OpportunityCard from "@/components/Opportunities/OpportunityCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

const mockOpportunities = [
  {
    type: "fellowship" as const,
    title: "AI Safety Research Fellowship",
    institution: "Stanford HAI",
    location: "Stanford, CA",
    deadline: "March 15, 2025",
    fields: ["AI Safety", "Ethics", "Machine Learning"],
    description: "Fully-funded fellowship for researchers working on alignment, interpretability, and safety in advanced AI systems. Includes stipend, research budget, and mentorship from leading AI researchers.",
  },
  {
    type: "assistantship" as const,
    title: "Graduate Research Assistant - Quantum Computing",
    institution: "MIT",
    location: "Cambridge, MA",
    deadline: "February 28, 2025",
    fields: ["Quantum Computing", "Physics", "Computer Science"],
    description: "Seeking motivated graduate students to join our quantum computing lab. Work on cutting-edge research in quantum error correction and algorithm design.",
  },
  {
    type: "collaboration" as const,
    title: "Cross-Disciplinary Climate Modeling Initiative",
    institution: "Oxford University",
    location: "Remote/Oxford, UK",
    deadline: "April 1, 2025",
    fields: ["Climate Science", "Data Science", "Policy"],
    description: "Collaborative research project bringing together climate scientists, data scientists, and policy experts to develop next-generation climate models.",
  },
  {
    type: "funding" as const,
    title: "Innovation Grant for Healthcare Technology",
    institution: "NIH",
    location: "USA",
    deadline: "March 30, 2025",
    fields: ["Healthcare", "Biotechnology", "Engineering"],
    description: "Funding opportunity for innovative healthcare technology projects that address critical gaps in patient care and medical diagnostics.",
  },
];

const Opportunities = () => {
  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Research Opportunities</h1>
            <p className="text-muted-foreground text-lg">
              Discover fellowships, assistantships, collaborations, and funding opportunities
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search opportunities..."
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" className="md:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">All</Button>
            <Button variant="outline" size="sm">Fellowships</Button>
            <Button variant="outline" size="sm">Assistantships</Button>
            <Button variant="outline" size="sm">Collaborations</Button>
            <Button variant="outline" size="sm">Funding</Button>
          </div>

          {/* Opportunities Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {mockOpportunities.map((opportunity, index) => (
              <OpportunityCard key={index} {...opportunity} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Opportunities;

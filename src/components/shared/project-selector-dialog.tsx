"use client";

import { useState, useMemo } from "react";
import { Check, Search, X, Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatCurrency } from "@/lib/utils";
import type { ProjectWithTotals, MatchSuggestion } from "@/types";

interface ProjectSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectWithTotals[];
  currentProjectId: string | null;
  suggestions?: MatchSuggestion[];
  onSelect: (projectId: string | null) => void;
  title?: string;
  description?: string;
}

export function ProjectSelectorDialog({
  open,
  onOpenChange,
  projects,
  currentProjectId,
  suggestions = [],
  onSelect,
  title = "Assign to Project",
  description = "Select a project to link this item to.",
}: ProjectSelectorDialogProps) {
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const lowerSearch = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.code.toLowerCase().includes(lowerSearch) ||
        p.clientName.toLowerCase().includes(lowerSearch) ||
        p.description.toLowerCase().includes(lowerSearch)
    );
  }, [projects, search]);

  const activeProjects = filteredProjects.filter((p) => p.status === "active");
  const closedProjects = filteredProjects.filter((p) => p.status === "closed");

  const handleSelect = async (projectId: string | null) => {
    setIsLoading(true);
    try {
      await onSelect(projectId);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestion = (projectId: string) => {
    return suggestions.find((s) => s.projectId === projectId);
  };

  const ProjectItem = ({ project }: { project: ProjectWithTotals }) => {
    const isSelected = project.id === currentProjectId;
    const suggestion = getSuggestion(project.id);
    const confidenceColors = {
      high: "bg-green-500/10 text-green-600 border-green-500/20",
      medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      low: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    };

    return (
      <button
        type="button"
        onClick={() => handleSelect(project.id)}
        disabled={isLoading}
        className={cn(
          "w-full text-left p-3 rounded-lg border transition-colors",
          "hover:bg-accent hover:border-primary/50",
          isSelected && "bg-primary/10 border-primary",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold">{project.code}</span>
              <Badge
                variant={project.status === "active" ? "default" : "secondary"}
                className="text-xs"
              >
                {project.status}
              </Badge>
              {suggestion && (
                <Badge
                  variant="outline"
                  className={cn("text-xs", confidenceColors[suggestion.confidence])}
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  {suggestion.confidence} match
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1 truncate">
              {project.clientName} - {project.description}
            </div>
            {suggestion && (
              <div className="text-xs text-muted-foreground mt-1 italic">
                {suggestion.reason}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {project.totals.outstanding > 0 && (
              <span className="text-xs text-warning">
                {formatCurrency(project.totals.outstanding)} outstanding
              </span>
            )}
            {isSelected && <Check className="h-5 w-5 text-primary" />}
          </div>
        </div>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code, client, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Suggestions section */}
          {suggestions.length > 0 && !search && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Lightbulb className="h-4 w-4" />
                Suggested Matches
              </div>
              <div className="space-y-2">
                {suggestions.map((suggestion) => {
                  const project = projects.find((p) => p.id === suggestion.projectId);
                  if (!project) return null;
                  return <ProjectItem key={project.id} project={project} />;
                })}
              </div>
            </div>
          )}

          {/* Projects list */}
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {/* Active projects */}
              {activeProjects.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Active Projects ({activeProjects.length})
                  </div>
                  <div className="space-y-2">
                    {activeProjects.map((project) => (
                      <ProjectItem key={project.id} project={project} />
                    ))}
                  </div>
                </div>
              )}

              {/* Closed projects */}
              {closedProjects.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Closed Projects ({closedProjects.length})
                  </div>
                  <div className="space-y-2">
                    {closedProjects.map((project) => (
                      <ProjectItem key={project.id} project={project} />
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {filteredProjects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No projects found matching &quot;{search}&quot;
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t">
            {currentProjectId && (
              <Button
                variant="outline"
                onClick={() => handleSelect(null)}
                disabled={isLoading}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Unassign
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className={!currentProjectId ? "ml-auto" : ""}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Search, AlertTriangle, FileQuestion, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ProjectsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  client: string;
  onClientChange: (value: string) => void;
  clients: string[];
  filter?: string;
  onFilterChange?: (value: string) => void;
}

export function ProjectsFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  client,
  onClientChange,
  clients,
  filter = "all",
  onFilterChange,
}: ProjectsFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Quick filter badges */}
      {onFilterChange && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={filter === "all" ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/80 transition-colors"
            onClick={() => onFilterChange("all")}
          >
            All Projects
          </Badge>
          <Badge
            variant={filter === "has-issues" ? "destructive" : "outline"}
            className="cursor-pointer hover:bg-destructive/80 transition-colors"
            onClick={() => onFilterChange("has-issues")}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Has Issues
          </Badge>
          <Badge
            variant={filter === "missing-estimate" ? "warning" : "outline"}
            className="cursor-pointer hover:bg-warning/80 transition-colors"
            onClick={() => onFilterChange("missing-estimate")}
          >
            <FileQuestion className="h-3 w-3 mr-1" />
            Missing Estimate
          </Badge>
          <Badge
            variant={filter === "missing-pbs" ? "warning" : "outline"}
            className="cursor-pointer hover:bg-warning/80 transition-colors"
            onClick={() => onFilterChange("missing-pbs")}
          >
            <ClipboardList className="h-3 w-3 mr-1" />
            Missing PBS
          </Badge>
        </div>
      )}

      {/* Search and dropdowns */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={client} onValueChange={onClientChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

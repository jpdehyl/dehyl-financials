"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronRight, ExternalLink, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrency, formatDate, getDaysUntilDue } from "@/lib/utils";
import type { Bid } from "@/types";

interface BidsTableProps {
  bids: Bid[];
}

type SortKey = "name" | "clientName" | "estimatedValue" | "dueDate" | "status";
type SortDirection = "asc" | "desc";

const statusVariants: Record<Bid["status"], "default" | "secondary" | "success" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "default",
  won: "success",
  lost: "destructive",
  "no-bid": "outline",
};

const statusLabels: Record<Bid["status"], string> = {
  draft: "Draft",
  submitted: "Submitted",
  won: "Won",
  lost: "Lost",
  "no-bid": "No Bid",
};

export function BidsTable({ bids }: BidsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedBids = [...bids].sort((a, b) => {
    let aValue: string | number | Date | null;
    let bValue: string | number | Date | null;

    switch (sortKey) {
      case "name":
        aValue = a.name;
        bValue = b.name;
        break;
      case "clientName":
        aValue = a.clientName || "";
        bValue = b.clientName || "";
        break;
      case "estimatedValue":
        aValue = a.estimatedValue ?? 0;
        bValue = b.estimatedValue ?? 0;
        break;
      case "dueDate":
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === "asc"
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const SortableHeader = ({
    children,
    sortKeyName,
    className,
  }: {
    children: React.ReactNode;
    sortKeyName: SortKey;
    className?: string;
  }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => handleSort(sortKeyName)}
      >
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader sortKeyName="name">Bid Name</SortableHeader>
            <SortableHeader sortKeyName="clientName">Client</SortableHeader>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <SortableHeader sortKeyName="estimatedValue" className="text-right">
              Est. Value
            </SortableHeader>
            <SortableHeader sortKeyName="dueDate">Due Date</SortableHeader>
            <SortableHeader sortKeyName="status">Status</SortableHeader>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBids.map((bid) => {
            const daysUntil = bid.dueDate ? getDaysUntilDue(bid.dueDate) : null;
            const isDueSoon = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0 && bid.status === "draft";

            return (
              <TableRow key={bid.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{bid.name}</span>
                    {isDueSoon && (
                      <Badge variant="warning" className="text-xs">
                        Due in {daysUntil} days
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">{bid.clientCode}</span>
                    <span className="text-muted-foreground ml-1 hidden sm:inline">
                      - {bid.clientName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                  {bid.description}
                </TableCell>
                <TableCell className="text-right">
                  {bid.estimatedValue ? formatCurrency(bid.estimatedValue) : "-"}
                </TableCell>
                <TableCell>
                  {bid.dueDate ? formatDate(bid.dueDate) : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariants[bid.status]}>
                    {statusLabels[bid.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Bid</DropdownMenuItem>
                      {bid.status === "submitted" && (
                        <>
                          <DropdownMenuItem className="text-success">
                            Mark as Won
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Mark as Lost
                          </DropdownMenuItem>
                        </>
                      )}
                      {bid.status === "draft" && (
                        <DropdownMenuItem>Mark as Submitted</DropdownMenuItem>
                      )}
                      {bid.status === "won" && !bid.convertedProjectId && (
                        <DropdownMenuItem>Convert to Project</DropdownMenuItem>
                      )}
                      {bid.driveFolderId && (
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in Drive
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

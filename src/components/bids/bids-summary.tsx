"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { FileText, Trophy, XCircle, Clock, TrendingUp } from "lucide-react";
import type { Bid } from "@/types";
import { getBidStats } from "@/lib/mock-bids";

interface BidsSummaryProps {
  bids: Bid[];
}

export function BidsSummary({ bids }: BidsSummaryProps) {
  const stats = getBidStats(bids);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Draft</span>
            </div>
            <p className="text-2xl font-bold">{stats.draft}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Submitted</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span className="text-sm">Won</span>
            </div>
            <p className="text-2xl font-bold text-success">{stats.won}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Lost</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{stats.lost}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Win Rate</span>
            </div>
            <p className="text-2xl font-bold">{stats.conversionRate.toFixed(0)}%</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">Won Value</span>
            </div>
            <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalActualValue || stats.totalEstimatedValue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

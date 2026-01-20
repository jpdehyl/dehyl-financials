"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ProjectWithTotals } from "@/types";

interface ProjectsSummaryProps {
  projects: ProjectWithTotals[];
}

export function ProjectsSummary({ projects }: ProjectsSummaryProps) {
  const totals = projects.reduce(
    (acc, project) => ({
      estimated: acc.estimated + (project.estimateAmount ?? 0),
      invoiced: acc.invoiced + project.totals.invoiced,
      costs: acc.costs + project.totals.costs,
      profit: acc.profit + project.totals.profit,
    }),
    { estimated: 0, invoiced: 0, costs: 0, profit: 0 }
  );

  const activeCount = projects.filter((p) => p.status === "active").length;
  const closedCount = projects.filter((p) => p.status === "closed").length;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Projects</p>
            <p className="text-lg font-semibold">{projects.length}</p>
            <p className="text-xs text-muted-foreground">
              {activeCount} active, {closedCount} closed
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Estimated</p>
            <p className="text-lg font-semibold">{formatCurrency(totals.estimated)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Invoiced</p>
            <p className="text-lg font-semibold">{formatCurrency(totals.invoiced)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Costs</p>
            <p className="text-lg font-semibold">{formatCurrency(totals.costs)}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <p className="text-xs text-muted-foreground">Total Profit</p>
            <p className={`text-lg font-semibold ${totals.profit >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(totals.profit)}
            </p>
            {totals.invoiced > 0 && (
              <p className="text-xs text-muted-foreground">
                {((totals.profit / totals.invoiced) * 100).toFixed(1)}% margin
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

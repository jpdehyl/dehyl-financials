"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, formatCurrency } from "@/lib/utils";
import type { ProjectWithTotals } from "@/types";

interface ProjectFinancialsProps {
  project: ProjectWithTotals;
}

export function ProjectFinancials({ project }: ProjectFinancialsProps) {
  const { estimateAmount, totals } = project;
  const { invoiced, paid, outstanding, costs, profit } = totals;

  const invoicedPercent = estimateAmount
    ? Math.min((invoiced / estimateAmount) * 100, 100)
    : 0;
  const paidPercent = invoiced ? (paid / invoiced) * 100 : 0;
  const profitMargin = invoiced ? (profit / invoiced) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Estimate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Estimate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {estimateAmount ? formatCurrency(estimateAmount) : "Not set"}
          </div>
          {estimateAmount && (
            <>
              <Progress value={invoicedPercent} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {invoicedPercent.toFixed(0)}% invoiced
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoiced / Paid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {formatCurrency(paid)}
          </div>
          <p className="text-xs text-muted-foreground">
            paid of {formatCurrency(invoiced)} invoiced
          </p>
          {outstanding > 0 && (
            <p className="text-xs text-warning mt-1">
              {formatCurrency(outstanding)} outstanding
            </p>
          )}
          <Progress value={paidPercent} className="mt-2 h-2" />
        </CardContent>
      </Card>

      {/* Costs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Costs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(costs)}
          </div>
          <p className="text-xs text-muted-foreground">
            bills and expenses
          </p>
        </CardContent>
      </Card>

      {/* Profit */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold",
              profit >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {formatCurrency(profit)}
          </div>
          {invoiced > 0 && (
            <p className="text-xs text-muted-foreground">
              {profitMargin.toFixed(1)}% margin
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { EstimateCategory, EstimateLineItem, EstimateStatus } from "@/types";

interface EstimateSummaryProps {
  lineItems: EstimateLineItem[];
  status: EstimateStatus;
  actualInvoiced?: number;
}

const CATEGORY_COLORS: Record<EstimateCategory, string> = {
  labor: "bg-blue-500",
  materials: "bg-green-500",
  equipment: "bg-yellow-500",
  subcontractors: "bg-purple-500",
  permits: "bg-orange-500",
  other: "bg-gray-500",
};

const CATEGORY_LABELS: Record<EstimateCategory, string> = {
  labor: "Labor",
  materials: "Materials",
  equipment: "Equipment",
  subcontractors: "Subcontractors",
  permits: "Permits",
  other: "Other",
};

const STATUS_VARIANTS: Record<EstimateStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  sent: "default",
  approved: "default",
  rejected: "destructive",
};

export function EstimateSummary({ lineItems, status, actualInvoiced }: EstimateSummaryProps) {
  // Calculate totals by category
  const categoryTotals = lineItems.reduce((acc, item) => {
    const total = item.quantity * item.unitPrice;
    acc[item.category] = (acc[item.category] || 0) + total;
    return acc;
  }, {} as Record<EstimateCategory, number>);

  const totalAmount = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

  // Sort categories by value descending
  const sortedCategories = (Object.entries(categoryTotals) as [EstimateCategory, number][])
    .sort((a, b) => b[1] - a[1]);

  // Calculate variance if actual invoiced is provided
  const variance = actualInvoiced !== undefined ? actualInvoiced - totalAmount : null;
  const variancePercent = variance !== null && totalAmount > 0
    ? ((variance / totalAmount) * 100).toFixed(1)
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Estimate Summary</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </div>
          <Badge variant={STATUS_VARIANTS[status]} className="capitalize">
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total */}
        <div className="text-center py-4 border-b">
          <div className="text-sm text-muted-foreground">Total Estimate</div>
          <div className="text-3xl font-bold">{formatCurrency(totalAmount)}</div>
        </div>

        {/* Category breakdown */}
        <div className="space-y-3">
          {sortedCategories.map(([category, amount]) => {
            const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
            return (
              <div key={category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[category]}`} />
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={percentage} className="h-2" />
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Variance from actual (if provided) */}
        {actualInvoiced !== undefined && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span>Actual Invoiced</span>
              <span className="font-medium">{formatCurrency(actualInvoiced)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Variance</span>
              <span className={`font-medium ${variance! > 0 ? "text-warning" : "text-success"}`}>
                {variance! > 0 ? "+" : ""}{formatCurrency(variance!)}
                {variancePercent && ` (${variance! > 0 ? "+" : ""}${variancePercent}%)`}
              </span>
            </div>
          </div>
        )}

        {/* Line item count */}
        <div className="pt-4 border-t text-sm text-muted-foreground text-center">
          {lineItems.length} line item{lineItems.length !== 1 ? "s" : ""}
        </div>
      </CardContent>
    </Card>
  );
}

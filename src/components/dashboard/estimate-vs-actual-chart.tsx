"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { ProjectWithTotals } from "@/types";

interface EstimateVsActualChartProps {
  projects: ProjectWithTotals[];
}

export function EstimateVsActualChart({ projects }: EstimateVsActualChartProps) {
  // Filter projects with estimates and transform data
  const data = projects
    .filter((p) => p.estimateAmount && p.estimateAmount > 0)
    .slice(0, 8) // Limit to 8 most recent
    .map((p) => {
      const variance = p.totals.invoiced - p.estimateAmount!;
      const variancePercent = ((variance / p.estimateAmount!) * 100).toFixed(0);
      return {
        name: p.code,
        estimate: p.estimateAmount,
        actual: p.totals.invoiced,
        variance,
        variancePercent: parseFloat(variancePercent),
        isOverBudget: variance > 0,
      };
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimate vs Actual</CardTitle>
        <CardDescription>Compare project budgets to actual invoiced amounts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              barGap={0}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(value as number),
                  name === "estimate" ? "Estimate" : "Actual",
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="estimate"
                name="Estimate"
                fill="hsl(var(--muted-foreground))"
                opacity={0.5}
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.actual <= (entry.estimate || 0)
                        ? "hsl(var(--success))"
                        : "hsl(var(--warning))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Variance summary */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="font-mono">{item.name}</span>
              <span
                className={
                  item.variance <= 0 ? "text-success" : "text-warning"
                }
              >
                {item.variance <= 0 ? "" : "+"}
                {item.variancePercent}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

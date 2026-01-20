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
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { Bid } from "@/types";
import { getBidStats } from "@/lib/mock-bids";

interface BidConversionChartProps {
  bids: Bid[];
}

export function BidConversionChart({ bids }: BidConversionChartProps) {
  const stats = getBidStats(bids);

  // Funnel data
  const funnelData = [
    {
      stage: "Submitted",
      count: stats.submitted + stats.won + stats.lost,
      color: "hsl(var(--primary))",
    },
    {
      stage: "Responded",
      count: stats.won + stats.lost,
      color: "hsl(var(--warning))",
    },
    {
      stage: "Won",
      count: stats.won,
      color: "hsl(var(--success))",
    },
  ];

  // Value by status
  const valueData = [
    {
      status: "Won",
      value: bids
        .filter((b) => b.status === "won")
        .reduce((sum, b) => sum + (b.actualValue || b.estimatedValue || 0), 0),
      color: "hsl(var(--success))",
    },
    {
      status: "Pending",
      value: bids
        .filter((b) => b.status === "submitted")
        .reduce((sum, b) => sum + (b.estimatedValue || 0), 0),
      color: "hsl(var(--primary))",
    },
    {
      status: "Lost",
      value: bids
        .filter((b) => b.status === "lost")
        .reduce((sum, b) => sum + (b.estimatedValue || 0), 0),
      color: "hsl(var(--destructive))",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bid Conversion</CardTitle>
        <CardDescription>
          Win rate: {stats.conversionRate.toFixed(0)}% ({stats.won} won of{" "}
          {stats.won + stats.lost + stats.submitted} bids)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Funnel */}
          <div>
            <h4 className="text-sm font-medium mb-3">Conversion Funnel</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value) => [value, "Count"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList dataKey="count" position="right" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Value by Status */}
          <div>
            <h4 className="text-sm font-medium mb-3">Value by Status</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={valueData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="status"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value as number), "Value"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {valueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

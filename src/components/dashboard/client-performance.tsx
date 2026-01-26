"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, TrendingUp, Users } from "lucide-react";

interface ClientStats {
  clientCode: string;
  clientName: string;
  totalBids: number;
  bidsWon: number;
  bidsLost: number;
  winRate: number;
  totalRevenue: number;
  projectCount: number;
  avgProjectValue: number;
  avgDaysToPayment: number | null;
}

interface ClientAnalyticsData {
  clients: ClientStats[];
  summary: {
    totalClients: number;
    overallWinRate: number;
    topClient: string | null;
  };
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(217, 91%, 60%)",
  "hsl(280, 65%, 60%)",
];

function getWinRateBadgeVariant(rate: number): "default" | "secondary" | "destructive" {
  if (rate >= 70) return "default";
  if (rate >= 50) return "secondary";
  return "destructive";
}

export function ClientPerformance() {
  const [data, setData] = useState<ClientAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/analytics/clients");
        if (!res.ok) {
          throw new Error("Failed to fetch client analytics");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[250px]" />
            <Skeleton className="h-[250px]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Client Performance
          </CardTitle>
          <CardDescription>No client data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect QuickBooks and sync your data to see client analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { clients, summary } = data;

  // Top 5 clients by revenue for the chart
  const chartData = clients.slice(0, 5).map((client, index) => ({
    name: client.clientCode,
    fullName: client.clientName,
    revenue: client.totalRevenue,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Client Performance
            </CardTitle>
            <CardDescription>
              {summary.totalClients} clients | {summary.overallWinRate}% overall win rate
              {summary.topClient && ` | Top: ${summary.topClient}`}
            </CardDescription>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue by Client Chart */}
            <div>
              <h4 className="text-sm font-medium mb-3">Revenue by Client (Top 5)</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <XAxis
                      type="number"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      width={50}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value as number), "Revenue"]}
                      labelFormatter={(label) => {
                        const client = chartData.find((c) => c.name === label);
                        return client?.fullName || label;
                      }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Client Stats Table */}
            <div>
              <h4 className="text-sm font-medium mb-3">All Clients</h4>
              <div className="max-h-[250px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-center">Bids</TableHead>
                      <TableHead className="text-center">Win Rate</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.clientCode}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{client.clientCode}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {client.clientName !== client.clientCode && client.clientName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-600 dark:text-green-400">{client.bidsWon}</span>
                          <span className="text-muted-foreground">/</span>
                          <span>{client.totalBids}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {client.totalBids > 0 ? (
                            <Badge variant={getWinRateBadgeVariant(client.winRate)}>
                              {client.winRate}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(client.totalRevenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Extended Stats - shown below on larger screens */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium mb-3">Detailed Performance</h4>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-center">Projects</TableHead>
                    <TableHead className="text-right">Avg Project Value</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-center">Avg Days to Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={`detail-${client.clientCode}`}>
                      <TableCell className="font-medium">{client.clientName}</TableCell>
                      <TableCell className="text-center">{client.projectCount}</TableCell>
                      <TableCell className="text-right">
                        {client.avgProjectValue > 0
                          ? formatCurrency(client.avgProjectValue)
                          : <span className="text-muted-foreground">-</span>
                        }
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(client.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-center">
                        {client.avgDaysToPayment !== null ? (
                          <span className={cn(
                            client.avgDaysToPayment <= 30
                              ? "text-green-600 dark:text-green-400"
                              : client.avgDaysToPayment <= 60
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-red-600 dark:text-red-400"
                          )}>
                            {client.avgDaysToPayment} days
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Dashboard } from "@/lib/json-render/renderer";

type StatusFilter = "active" | "closed" | "all";

/**
 * GET /api/projects/json
 * Returns projects data in json-render Dashboard JSON format
 * 
 * Query params:
 * - status: "active" | "closed" | "all" (default: "all")
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusFilter = (searchParams.get("status") || "all") as StatusFilter;

  const supabase = await createClient();

  // Build query based on status filter
  let query = supabase
    .from("projects")
    .select("*")
    .order("code", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: projectsData, error: projectsError } = await query;

  if (projectsError) {
    return NextResponse.json(
      { error: "Failed to fetch projects", details: projectsError.message },
      { status: 500 }
    );
  }

  // Fetch invoices and bills for totals
  const { data: invoicesData } = await supabase
    .from("invoices")
    .select("project_id, amount, balance");

  const { data: billsData } = await supabase
    .from("bills")
    .select("project_id, amount, balance");

  // Compute totals per project
  const invoiceTotals = new Map<string, { invoiced: number; outstanding: number }>();
  const billTotals = new Map<string, number>();

  (invoicesData || []).forEach((inv) => {
    if (inv.project_id) {
      const current = invoiceTotals.get(inv.project_id) || { invoiced: 0, outstanding: 0 };
      current.invoiced += Number(inv.amount);
      current.outstanding += Number(inv.balance);
      invoiceTotals.set(inv.project_id, current);
    }
  });

  (billsData || []).forEach((bill) => {
    if (bill.project_id) {
      const current = billTotals.get(bill.project_id) || 0;
      billTotals.set(bill.project_id, current + Number(bill.amount));
    }
  });

  // Calculate summary stats
  const projects = projectsData || [];
  const activeCount = projects.filter((p) => p.status === "active").length;
  const closedCount = projects.filter((p) => p.status === "closed").length;
  const totalEstimate = projects.reduce((sum, p) => sum + (Number(p.estimate_amount) || 0), 0);
  const totalInvoiced = Array.from(invoiceTotals.values()).reduce((sum, t) => sum + t.invoiced, 0);

  // Group by client code for bar chart
  const clientGroups = new Map<string, { count: number; value: number }>();
  projects.forEach((p) => {
    const code = p.client_code || "Unknown";
    const current = clientGroups.get(code) || { count: 0, value: 0 };
    current.count += 1;
    const invTotal = invoiceTotals.get(p.id);
    if (invTotal) {
      current.value += invTotal.invoiced;
    }
    clientGroups.set(code, current);
  });

  const clientChartData = Array.from(clientGroups.entries())
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 5)
    .map(([client, data]) => ({
      client,
      projects: data.count,
      revenue: data.value,
    }));

  // Recent projects for table
  const recentProjects = projects
    .slice(0, 5)
    .map((p) => {
      const invTotals = invoiceTotals.get(p.id) || { invoiced: 0, outstanding: 0 };
      const costs = billTotals.get(p.id) || 0;
      const paid = invTotals.invoiced - invTotals.outstanding;
      const profit = paid - costs;

      return {
        code: p.code,
        client: p.client_name || p.client_code || "-",
        description: p.description || "-",
        invoiced: invTotals.invoiced,
        profit,
        status: p.status,
      };
    });

  const dashboard: Dashboard = {
    version: 1,
    title: "Projects Overview",
    layout: [
      {
        component: "grid",
        props: { columns: 4, gap: "md" },
        children: [
          {
            component: "stat-card",
            props: {
              label: "Active Projects",
              value: String(activeCount),
              description: "Currently in progress",
              variant: "success",
            },
          },
          {
            component: "stat-card",
            props: {
              label: "Closed Projects",
              value: String(closedCount),
              description: "Completed work",
              variant: "default",
            },
          },
          {
            component: "stat-card",
            props: {
              label: "Total Estimated",
              value: `$${(totalEstimate / 1000).toFixed(0)}k`,
              description: "Across all projects",
              variant: "default",
            },
          },
          {
            component: "stat-card",
            props: {
              label: "Total Invoiced",
              value: `$${(totalInvoiced / 1000).toFixed(0)}k`,
              description: "Revenue billed",
              variant: "success",
            },
          },
        ],
      },
      {
        component: "grid",
        props: { columns: 2, gap: "md" },
        children: [
          {
            component: "bar-chart",
            props: {
              title: "Projects by Client",
              description: "Top 5 clients by revenue",
              xKey: "client",
              bars: [
                { dataKey: "revenue", label: "Revenue", color: "primary" },
              ],
              data: clientChartData,
            },
          },
          {
            component: "data-table",
            props: {
              title: "Recent Projects",
              columns: [
                { key: "code", label: "Code" },
                { key: "client", label: "Client" },
                { key: "invoiced", label: "Invoiced", format: "currency" },
                { key: "profit", label: "Profit", format: "currency" },
                { key: "status", label: "Status", format: "badge" },
              ],
              rows: recentProjects,
              emptyMessage: "No projects found",
            },
          },
        ],
      },
    ],
  };

  return NextResponse.json(dashboard);
}

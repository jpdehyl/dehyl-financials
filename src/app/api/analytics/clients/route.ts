import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

interface ClientAnalyticsResponse {
  clients: ClientStats[];
  summary: {
    totalClients: number;
    overallWinRate: number;
    topClient: string | null;
  };
}

export async function GET() {
  const supabase = await createClient();

  // Fetch bids grouped by client
  const { data: bids, error: bidsError } = await supabase
    .from("bids")
    .select("id, client_code, client_name, status")
    .not("client_code", "is", null);

  if (bidsError) {
    return NextResponse.json({ error: bidsError.message }, { status: 500 });
  }

  // Fetch projects with their invoices for revenue calculation
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, client_code, client_name");

  if (projectsError) {
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  // Fetch invoices with project_id for revenue and payment timing
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("id, project_id, amount, balance, issue_date, status");

  if (invoicesError) {
    return NextResponse.json({ error: invoicesError.message }, { status: 500 });
  }

  // Fetch paid invoices separately to calculate avg days to payment
  // Using synced_at as proxy for payment date when balance = 0
  const { data: paidInvoices, error: paidError } = await supabase
    .from("invoices")
    .select("id, project_id, issue_date, synced_at")
    .eq("status", "paid");

  if (paidError) {
    return NextResponse.json({ error: paidError.message }, { status: 500 });
  }

  // Build a map of project_id to client_code
  const projectClientMap = new Map<string, { clientCode: string; clientName: string }>();
  for (const project of projects || []) {
    projectClientMap.set(project.id, {
      clientCode: project.client_code,
      clientName: project.client_name || project.client_code,
    });
  }

  // Calculate stats per client
  const clientStatsMap = new Map<string, {
    clientCode: string;
    clientName: string;
    totalBids: number;
    bidsWon: number;
    bidsLost: number;
    totalRevenue: number;
    projectIds: Set<string>;
    paymentDays: number[];
  }>();

  // Process bids
  for (const bid of bids || []) {
    const code = bid.client_code;
    if (!code) continue;

    if (!clientStatsMap.has(code)) {
      clientStatsMap.set(code, {
        clientCode: code,
        clientName: bid.client_name || code,
        totalBids: 0,
        bidsWon: 0,
        bidsLost: 0,
        totalRevenue: 0,
        projectIds: new Set(),
        paymentDays: [],
      });
    }

    const stats = clientStatsMap.get(code)!;
    stats.totalBids++;
    if (bid.status === "won") stats.bidsWon++;
    if (bid.status === "lost") stats.bidsLost++;
  }

  // Process projects (add clients that have projects but no bids)
  for (const project of projects || []) {
    const code = project.client_code;
    if (!code) continue;

    if (!clientStatsMap.has(code)) {
      clientStatsMap.set(code, {
        clientCode: code,
        clientName: project.client_name || code,
        totalBids: 0,
        bidsWon: 0,
        bidsLost: 0,
        totalRevenue: 0,
        projectIds: new Set(),
        paymentDays: [],
      });
    }

    const stats = clientStatsMap.get(code)!;
    stats.projectIds.add(project.id);
  }

  // Process invoices for revenue
  for (const invoice of invoices || []) {
    if (!invoice.project_id) continue;
    const projectInfo = projectClientMap.get(invoice.project_id);
    if (!projectInfo) continue;

    const stats = clientStatsMap.get(projectInfo.clientCode);
    if (stats) {
      stats.totalRevenue += Number(invoice.amount) || 0;
    }
  }

  // Calculate avg days to payment from paid invoices
  for (const invoice of paidInvoices || []) {
    if (!invoice.project_id || !invoice.issue_date || !invoice.synced_at) continue;
    const projectInfo = projectClientMap.get(invoice.project_id);
    if (!projectInfo) continue;

    const stats = clientStatsMap.get(projectInfo.clientCode);
    if (stats) {
      const issueDate = new Date(invoice.issue_date);
      const paymentDate = new Date(invoice.synced_at);
      const daysDiff = Math.floor(
        (paymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff >= 0) {
        stats.paymentDays.push(daysDiff);
      }
    }
  }

  // Convert to array and calculate final stats
  const clients: ClientStats[] = Array.from(clientStatsMap.values())
    .map((stats) => {
      const projectCount = stats.projectIds.size;
      const winRate = stats.totalBids > 0
        ? Math.round((stats.bidsWon / stats.totalBids) * 1000) / 10
        : 0;
      const avgProjectValue = projectCount > 0
        ? Math.round(stats.totalRevenue / projectCount)
        : 0;
      const avgDaysToPayment = stats.paymentDays.length > 0
        ? Math.round(stats.paymentDays.reduce((a, b) => a + b, 0) / stats.paymentDays.length)
        : null;

      return {
        clientCode: stats.clientCode,
        clientName: stats.clientName,
        totalBids: stats.totalBids,
        bidsWon: stats.bidsWon,
        bidsLost: stats.bidsLost,
        winRate,
        totalRevenue: stats.totalRevenue,
        projectCount,
        avgProjectValue,
        avgDaysToPayment,
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Calculate summary
  const totalBidsAll = clients.reduce((sum, c) => sum + c.totalBids, 0);
  const totalWonAll = clients.reduce((sum, c) => sum + c.bidsWon, 0);
  const overallWinRate = totalBidsAll > 0
    ? Math.round((totalWonAll / totalBidsAll) * 1000) / 10
    : 0;

  const response: ClientAnalyticsResponse = {
    clients,
    summary: {
      totalClients: clients.length,
      overallWinRate,
      topClient: clients.length > 0 ? clients[0].clientName : null,
    },
  };

  return NextResponse.json(response);
}

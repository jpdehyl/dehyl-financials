import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DashboardData, Alert, ActivityItem } from "@/types";
import { getDaysOverdue, getDaysUntilDue } from "@/lib/utils";

export async function GET() {
  const supabase = await createClient();

  // Fetch open invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, client_name, amount, balance, due_date, status, project_id")
    .gt("balance", 0);

  // Fetch open bills
  const { data: bills } = await supabase
    .from("bills")
    .select("id, vendor_name, amount, balance, due_date, status, project_id")
    .gt("balance", 0);

  // Fetch active projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, code, estimate_amount, has_pbs")
    .eq("status", "active");

  // Get last sync times
  const { data: qbSyncLog } = await supabase
    .from("sync_log")
    .select("completed_at")
    .eq("source", "quickbooks")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  // Calculate KPIs
  const totalReceivables = (invoices || []).reduce((sum, inv) => sum + Number(inv.balance), 0);
  const totalPayables = (bills || []).reduce((sum, bill) => sum + Number(bill.balance), 0);
  const netPosition = totalReceivables - totalPayables;
  const activeProjects = projects?.length || 0;

  // Count overdue invoices
  const overdueInvoices = (invoices || []).filter((inv) => {
    const daysOverdue = getDaysOverdue(inv.due_date);
    return daysOverdue > 0;
  });
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0);

  // Count bills due this week
  const billsDueSoon = (bills || []).filter((bill) => {
    const daysUntil = getDaysUntilDue(bill.due_date);
    return daysUntil >= 0 && daysUntil <= 7;
  });
  const billsDueAmount = billsDueSoon.reduce((sum, bill) => sum + Number(bill.balance), 0);

  // Generate alerts
  const alerts: Alert[] = [];

  if (overdueInvoices.length > 0) {
    alerts.push({
      type: "overdue_invoice",
      count: overdueInvoices.length,
      total: overdueAmount,
      invoices: overdueInvoices.map((inv) => inv.invoice_number || inv.id),
      severity: "critical",
    });
  }

  if (billsDueSoon.length > 0) {
    alerts.push({
      type: "bills_due_soon",
      count: billsDueSoon.length,
      total: billsDueAmount,
      severity: "warning",
    });
  }

  // Check for unassigned invoices
  const unassignedInvoices = (invoices || []).filter((inv) => !inv.project_id);
  if (unassignedInvoices.length > 0) {
    alerts.push({
      type: "unassigned_invoices",
      count: unassignedInvoices.length,
      total: unassignedInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0),
      severity: "info",
    });
  }

  // Check for projects missing estimates
  const projectsMissingEstimate = (projects || []).filter((p) => !p.estimate_amount);
  if (projectsMissingEstimate.length > 0) {
    alerts.push({
      type: "missing_estimate",
      count: projectsMissingEstimate.length,
      projects: projectsMissingEstimate.map((p) => p.code),
      severity: "warning",
    });
  }

  // Check for projects missing PBS
  const projectsMissingPBS = (projects || []).filter((p) => !p.has_pbs);
  if (projectsMissingPBS.length > 0) {
    alerts.push({
      type: "missing_pbs",
      count: projectsMissingPBS.length,
      projects: projectsMissingPBS.map((p) => p.code),
      severity: "info",
    });
  }

  // Recent activity (placeholder - in production, would track actual events)
  const recentActivity: ActivityItem[] = [];

  const dashboardData: DashboardData = {
    kpis: {
      totalReceivables,
      totalPayables,
      netPosition,
      activeProjects,
      overdueInvoices: overdueInvoices.length,
      overdueAmount,
      billsDueThisWeek: billsDueSoon.length,
      billsDueAmount,
    },
    alerts,
    recentActivity,
    lastSyncedAt: qbSyncLog?.completed_at ? new Date(qbSyncLog.completed_at) : null,
  };

  return NextResponse.json(dashboardData);
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Dashboard } from "@/lib/json-render/renderer";
import { getDaysOverdue } from "@/lib/utils";

/**
 * GET /api/receivables/json
 * Returns receivables (A/R) data in json-render Dashboard JSON format
 */
export async function GET() {
  const supabase = await createClient();

  // Fetch open invoices
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("*")
    .gt("balance", 0)
    .order("due_date", { ascending: true });

  if (invoicesError) {
    return NextResponse.json(
      { error: "Failed to fetch invoices", details: invoicesError.message },
      { status: 500 }
    );
  }

  const allInvoices = invoices || [];

  // Calculate KPIs
  const totalReceivables = allInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0);
  
  const overdueInvoices = allInvoices.filter((inv) => getDaysOverdue(inv.due_date) > 0);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0);
  
  const dueSoonInvoices = allInvoices.filter((inv) => {
    const days = getDaysOverdue(inv.due_date);
    return days <= 0 && days > -7;
  });
  const dueSoonAmount = dueSoonInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0);

  // Calculate aging buckets
  const aging = {
    current: 0,    // 0-30 days
    days31_60: 0,  // 31-60 days
    days61_90: 0,  // 61-90 days
    over90: 0,     // 90+ days
  };

  allInvoices.forEach((inv) => {
    const daysOverdue = getDaysOverdue(inv.due_date);
    const balance = Number(inv.balance);

    if (daysOverdue <= 0) {
      aging.current += balance;
    } else if (daysOverdue <= 30) {
      aging.current += balance;
    } else if (daysOverdue <= 60) {
      aging.days31_60 += balance;
    } else if (daysOverdue <= 90) {
      aging.days61_90 += balance;
    } else {
      aging.over90 += balance;
    }
  });

  const agingData = [
    { range: "0-30 days", amount: aging.current },
    { range: "31-60 days", amount: aging.days31_60 },
    { range: "61-90 days", amount: aging.days61_90 },
    { range: "90+ days", amount: aging.over90 },
  ];

  // Top 5 invoices by balance
  const topInvoices = [...allInvoices]
    .sort((a, b) => Number(b.balance) - Number(a.balance))
    .slice(0, 5)
    .map((inv) => ({
      number: inv.invoice_number || "-",
      client: inv.client_name,
      amount: Number(inv.balance),
      dueDate: inv.due_date,
      status: getDaysOverdue(inv.due_date) > 0 ? "Overdue" : "Open",
    }));

  const dashboard: Dashboard = {
    version: 1,
    title: "Accounts Receivable",
    layout: [
      {
        component: "grid",
        props: { columns: 3, gap: "md" },
        children: [
          {
            component: "kpi-card",
            props: {
              title: "Total Receivables",
              value: totalReceivables,
              format: "currency",
              icon: "dollar-sign",
              variant: "default",
              subtitle: `${allInvoices.length} open invoices`,
            },
          },
          {
            component: "kpi-card",
            props: {
              title: "Overdue",
              value: overdueAmount,
              format: "currency",
              icon: "alert-triangle",
              variant: overdueAmount > 0 ? "danger" : "success",
              subtitle: `${overdueInvoices.length} invoices`,
            },
          },
          {
            component: "kpi-card",
            props: {
              title: "Due Soon",
              value: dueSoonAmount,
              format: "currency",
              icon: "clock",
              variant: dueSoonAmount > 0 ? "warning" : "default",
              subtitle: `${dueSoonInvoices.length} invoices this week`,
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
              title: "Aging Analysis",
              description: "Outstanding invoices by age",
              xKey: "range",
              bars: [
                { dataKey: "amount", label: "Amount", color: "primary" },
              ],
              data: agingData,
            },
          },
          {
            component: "data-table",
            props: {
              title: "Top 5 Outstanding",
              columns: [
                { key: "number", label: "Invoice #" },
                { key: "client", label: "Client" },
                { key: "amount", label: "Amount", format: "currency" },
                { key: "dueDate", label: "Due Date", format: "date" },
                { key: "status", label: "Status", format: "badge" },
              ],
              rows: topInvoices,
              emptyMessage: "No open invoices",
            },
          },
        ],
      },
    ],
  };

  return NextResponse.json(dashboard);
}

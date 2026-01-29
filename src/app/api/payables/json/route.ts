import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Dashboard } from "@/lib/json-render/renderer";
import { getDaysOverdue, getDaysUntilDue } from "@/lib/utils";

/**
 * GET /api/payables/json
 * Returns payables (A/P) data in json-render Dashboard JSON format
 */
export async function GET() {
  const supabase = await createClient();

  // Fetch open bills
  const { data: bills, error: billsError } = await supabase
    .from("bills")
    .select("*")
    .gt("balance", 0)
    .order("due_date", { ascending: true });

  if (billsError) {
    return NextResponse.json(
      { error: "Failed to fetch bills", details: billsError.message },
      { status: 500 }
    );
  }

  const allBills = bills || [];

  // Calculate KPIs
  const totalPayables = allBills.reduce((sum, bill) => sum + Number(bill.balance), 0);
  
  const overdueBills = allBills.filter((bill) => getDaysOverdue(bill.due_date) > 0);
  const overdueAmount = overdueBills.reduce((sum, bill) => sum + Number(bill.balance), 0);
  
  const dueSoonBills = allBills.filter((bill) => {
    const days = getDaysUntilDue(bill.due_date);
    return days >= 0 && days <= 7;
  });
  const dueSoonAmount = dueSoonBills.reduce((sum, bill) => sum + Number(bill.balance), 0);

  // Calculate aging buckets
  const aging = {
    current: 0,    // 0-30 days
    days31_60: 0,  // 31-60 days
    days61_90: 0,  // 61-90 days
    over90: 0,     // 90+ days
  };

  allBills.forEach((bill) => {
    const daysOverdue = getDaysOverdue(bill.due_date);
    const balance = Number(bill.balance);

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

  // Top 5 bills by balance
  const topBills = [...allBills]
    .sort((a, b) => Number(b.balance) - Number(a.balance))
    .slice(0, 5)
    .map((bill) => ({
      vendor: bill.vendor_name,
      amount: Number(bill.balance),
      dueDate: bill.due_date,
      status: getDaysOverdue(bill.due_date) > 0 ? "Overdue" : "Open",
    }));

  const dashboard: Dashboard = {
    version: 1,
    title: "Accounts Payable",
    layout: [
      {
        component: "grid",
        props: { columns: 3, gap: "md" },
        children: [
          {
            component: "kpi-card",
            props: {
              title: "Total Payables",
              value: totalPayables,
              format: "currency",
              icon: "credit-card",
              variant: "default",
              subtitle: `${allBills.length} open bills`,
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
              subtitle: `${overdueBills.length} bills`,
            },
          },
          {
            component: "kpi-card",
            props: {
              title: "Due This Week",
              value: dueSoonAmount,
              format: "currency",
              icon: "clock",
              variant: dueSoonAmount > 0 ? "warning" : "default",
              subtitle: `${dueSoonBills.length} bills`,
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
              description: "Outstanding bills by age",
              xKey: "range",
              bars: [
                { dataKey: "amount", label: "Amount", color: "danger" },
              ],
              data: agingData,
            },
          },
          {
            component: "data-table",
            props: {
              title: "Top 5 Outstanding",
              columns: [
                { key: "vendor", label: "Vendor" },
                { key: "amount", label: "Amount", format: "currency" },
                { key: "dueDate", label: "Due Date", format: "date" },
                { key: "status", label: "Status", format: "badge" },
              ],
              rows: topBills,
              emptyMessage: "No open bills",
            },
          },
        ],
      },
    ],
  };

  return NextResponse.json(dashboard);
}

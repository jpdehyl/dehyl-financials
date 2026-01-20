"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceWithSuggestions } from "@/types";

interface InvoicesSummaryProps {
  invoices: InvoiceWithSuggestions[];
}

export function InvoicesSummary({ invoices }: InvoicesSummaryProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const totals = invoices.reduce(
    (acc, invoice) => {
      const balance = invoice.balance;
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      acc.total += balance;

      if (dueDate < today) {
        acc.overdue += balance;
        acc.overdueCount++;
      } else if (dueDate <= sevenDaysFromNow) {
        acc.dueThisWeek += balance;
        acc.dueThisWeekCount++;
      }

      return acc;
    },
    { total: 0, overdue: 0, overdueCount: 0, dueThisWeek: 0, dueThisWeekCount: 0 }
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total Outstanding</p>
            <p className="text-2xl font-bold text-success">
              {formatCurrency(totals.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {invoices.length} invoices
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(totals.overdue)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totals.overdueCount} invoices
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due This Week</p>
            <p className="text-2xl font-bold text-warning">
              {formatCurrency(totals.dueThisWeek)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totals.dueThisWeekCount} invoices
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Days Outstanding</p>
            <p className="text-2xl font-bold">
              {invoices.length > 0
                ? Math.round(
                    invoices.reduce((acc, inv) => {
                      const issueDate = new Date(inv.issueDate);
                      const today = new Date();
                      return acc + (today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24);
                    }, 0) / invoices.length
                  )
                : 0}
            </p>
            <p className="text-xs text-muted-foreground">days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

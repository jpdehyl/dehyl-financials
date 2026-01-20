"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Bill } from "@/types";

interface BillsSummaryProps {
  bills: Bill[];
}

export function BillsSummary({ bills }: BillsSummaryProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const totals = bills.reduce(
    (acc, bill) => {
      const balance = bill.balance;
      const dueDate = new Date(bill.dueDate);
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
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(totals.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {bills.length} bills
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(totals.overdue)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totals.overdueCount} bills
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due This Week</p>
            <p className="text-2xl font-bold text-warning">
              {formatCurrency(totals.dueThisWeek)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totals.dueThisWeekCount} bills
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due Later</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {formatCurrency(totals.total - totals.overdue - totals.dueThisWeek)}
            </p>
            <p className="text-xs text-muted-foreground">
              {bills.length - totals.overdueCount - totals.dueThisWeekCount} bills
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

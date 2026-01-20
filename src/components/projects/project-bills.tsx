"use client";

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
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatDate, getDaysOverdue, getDaysUntilDue } from "@/lib/utils";
import type { Bill } from "@/types";

interface ProjectBillsProps {
  bills: Bill[];
}

export function ProjectBills({ bills }: ProjectBillsProps) {
  const total = bills.reduce((acc, bill) => acc + bill.amount, 0);
  const outstanding = bills.reduce((acc, bill) => acc + bill.balance, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Costs</CardTitle>
        <CardDescription>
          {bills.length} bills totaling {formatCurrency(total)}
          {outstanding > 0 && ` • ${formatCurrency(outstanding)} unpaid`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bills.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No bills linked to this project
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Due</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => {
                const daysOverdue = getDaysOverdue(bill.dueDate);
                const daysUntil = getDaysUntilDue(bill.dueDate);
                const statusVariant =
                  bill.status === "paid"
                    ? "success"
                    : bill.status === "overdue"
                    ? "destructive"
                    : daysUntil <= 7
                    ? "warning"
                    : "secondary";

                return (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">
                      {bill.vendorName}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatDate(bill.billDate)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={cn(
                          bill.status === "overdue" && "text-destructive",
                          daysUntil <= 7 && daysUntil > 0 && "text-warning"
                        )}
                      >
                        {formatDate(bill.dueDate)}
                        {daysOverdue > 0 && ` (${daysOverdue}d overdue)`}
                        {daysUntil <= 7 && daysUntil > 0 && ` (${daysUntil}d)`}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bill.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {bill.balance > 0 ? (
                        <span className="text-warning">
                          {formatCurrency(bill.balance)}
                        </span>
                      ) : (
                        <span className="text-success">Paid</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant}>{bill.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import {
  Receipt,
  CreditCard,
  FolderKanban,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button variant="outline" className="justify-start h-auto py-3" asChild>
          <Link href="/receivables">
            <Receipt className="mr-2 h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">View Open Invoices</div>
              <div className="text-xs text-muted-foreground">
                Check who owes you money
              </div>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="justify-start h-auto py-3" asChild>
          <Link href="/payables">
            <CreditCard className="mr-2 h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">View Upcoming Bills</div>
              <div className="text-xs text-muted-foreground">
                See what you need to pay
              </div>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="justify-start h-auto py-3" asChild>
          <Link href="/projects">
            <FolderKanban className="mr-2 h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Browse Projects</div>
              <div className="text-xs text-muted-foreground">
                View all active projects
              </div>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="justify-start h-auto py-3" asChild>
          <a
            href="https://quickbooks.intuit.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Open QuickBooks</div>
              <div className="text-xs text-muted-foreground">
                Create invoices or enter bills
              </div>
            </div>
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

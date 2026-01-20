"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  FolderPlus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatCurrency, getRelativeTime } from "@/lib/utils";
import type { ActivityItem } from "@/types";

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const activityConfig = {
  payment_received: {
    icon: ArrowDownCircle,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  invoice_sent: {
    icon: FileText,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  bill_paid: {
    icon: ArrowUpCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  project_created: {
    icon: FolderPlus,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest transactions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest transactions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;

            return (
              <div key={index} className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    config.bgColor
                  )}
                >
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{getRelativeTime(activity.date)}</span>
                    {activity.amount && (
                      <>
                        <span>•</span>
                        <span className={config.color}>
                          {formatCurrency(activity.amount)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

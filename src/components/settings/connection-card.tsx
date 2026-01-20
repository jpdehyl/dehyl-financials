"use client";

import { Check, X, ExternalLink, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime } from "@/lib/utils";

interface ConnectionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  details?: {
    label: string;
    value: string;
  };
  lastSyncedAt?: Date;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export function ConnectionCard({
  title,
  description,
  icon,
  connected,
  details,
  lastSyncedAt,
  onConnect,
  onDisconnect,
  onSync,
  isSyncing,
}: ConnectionCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant={connected ? "success" : "secondary"}>
              {connected ? (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <X className="mr-1 h-3 w-3" />
                  Not Connected
                </>
              )}
            </Badge>
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected && details && (
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-sm text-muted-foreground">{details.label}</p>
            <p className="font-medium">{details.value}</p>
            {lastSyncedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Last synced {getRelativeTime(lastSyncedAt)}
              </p>
            )}
          </div>
        )}
        <div className="flex gap-2">
          {connected ? (
            <>
              {onSync && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSync}
                  disabled={isSyncing}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onDisconnect}
                className="text-destructive hover:text-destructive"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={onConnect} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Connect {title}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

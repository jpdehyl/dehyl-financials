"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  format?: "currency" | "number";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger";
  subtitle?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  format = "currency",
  trend,
  variant = "default",
  subtitle,
}: KPICardProps) {
  const formattedValue =
    format === "currency" ? formatCurrency(value) : value.toLocaleString();

  const variantStyles = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  };

  const iconBgStyles = {
    default: "bg-primary/10",
    success: "bg-success/10",
    warning: "bg-warning/10",
    danger: "bg-destructive/10",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-2xl font-bold", variantStyles[variant])}>
              {formattedValue}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-xs",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}% from last month
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg",
              iconBgStyles[variant]
            )}
          >
            <Icon className={cn("h-6 w-6", variantStyles[variant])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

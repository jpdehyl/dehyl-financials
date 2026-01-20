"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  FolderKanban,
} from "lucide-react";
import { KPICard } from "./kpi-card";
import type { DashboardKPIs } from "@/types";

interface KPIGridProps {
  kpis: DashboardKPIs;
}

export function KPIGrid({ kpis }: KPIGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total Receivables"
        value={kpis.totalReceivables}
        icon={ArrowDownCircle}
        variant="success"
        subtitle={`${kpis.overdueInvoices} overdue`}
      />
      <KPICard
        title="Total Payables"
        value={kpis.totalPayables}
        icon={ArrowUpCircle}
        variant="danger"
        subtitle={`${kpis.billsDueThisWeek} due this week`}
      />
      <KPICard
        title="Net Position"
        value={kpis.netPosition}
        icon={DollarSign}
        variant={kpis.netPosition >= 0 ? "success" : "danger"}
      />
      <KPICard
        title="Active Projects"
        value={kpis.activeProjects}
        icon={FolderKanban}
        format="number"
        variant="default"
      />
    </div>
  );
}

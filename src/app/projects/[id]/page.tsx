"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import {
  ProjectHeader,
  ProjectFinancials,
  ProjectInvoices,
  ProjectBills,
} from "@/components/projects";
import {
  getProjectById,
  getInvoicesByProjectId,
  getBillsByProjectId,
} from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params);
  const { sidebarOpen } = useAppStore();

  const project = getProjectById(id);

  if (!project) {
    notFound();
  }

  const invoices = getInvoicesByProjectId(id);
  const bills = getBillsByProjectId(id);

  return (
    <div
      className={cn(
        "transition-all duration-300",
        sidebarOpen ? "md:ml-0" : "md:ml-0"
      )}
    >
      <Header
        title={`Project ${project.code}`}
        description={`${project.clientName} - ${project.description}`}
      />
      <div className="p-4 md:p-6 space-y-6">
        {/* Project Header */}
        <ProjectHeader project={project} />

        {/* Financial Summary */}
        <ProjectFinancials project={project} />

        {/* Invoices and Bills */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ProjectInvoices invoices={invoices} />
          <ProjectBills bills={bills} />
        </div>
      </div>
    </div>
  );
}

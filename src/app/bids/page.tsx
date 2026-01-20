"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { BidsTable, BidsFilters, BidsSummary } from "@/components/bids";
import { Button } from "@/components/ui/button";
import { mockBids } from "@/lib/mock-bids";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function BidsPage() {
  const { sidebarOpen } = useAppStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [client, setClient] = useState("all");

  // Get unique clients
  const clients = useMemo(() => {
    const uniqueClients = new Set(
      mockBids.filter((b) => b.clientCode).map((b) => b.clientCode!)
    );
    return Array.from(uniqueClients).sort();
  }, []);

  // Filter bids
  const filteredBids = useMemo(() => {
    return mockBids.filter((bid) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          bid.name.toLowerCase().includes(searchLower) ||
          (bid.clientCode?.toLowerCase().includes(searchLower) ?? false) ||
          (bid.clientName?.toLowerCase().includes(searchLower) ?? false) ||
          (bid.description?.toLowerCase().includes(searchLower) ?? false);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (status !== "all" && bid.status !== status) {
        return false;
      }

      // Client filter
      if (client !== "all" && bid.clientCode !== client) {
        return false;
      }

      return true;
    });
  }, [search, status, client]);

  return (
    <div
      className={cn(
        "transition-all duration-300",
        sidebarOpen ? "md:ml-0" : "md:ml-0"
      )}
    >
      <Header
        title="Bids"
        description="Track bid submissions and conversion rates"
        action={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Bid
          </Button>
        }
      />
      <div className="p-4 md:p-6 space-y-6">
        {/* Summary */}
        <BidsSummary bids={filteredBids} />

        {/* Filters */}
        <BidsFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          client={client}
          onClientChange={setClient}
          clients={clients}
        />

        {/* Table */}
        <BidsTable bids={filteredBids} />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClientMapping } from "@/types";

interface ClientMappingsProps {
  mappings: ClientMapping[];
  onUpdate?: () => void;
}

interface MappingFormData {
  code: string;
  displayName: string;
  qbCustomerName: string;
  aliases: string[];
}

const emptyFormData: MappingFormData = {
  code: "",
  displayName: "",
  qbCustomerName: "",
  aliases: [],
};

export function ClientMappings({ mappings, onUpdate }: ClientMappingsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ClientMapping | null>(null);
  const [deletingMapping, setDeletingMapping] = useState<ClientMapping | null>(null);
  const [formData, setFormData] = useState<MappingFormData>(emptyFormData);
  const [aliasInput, setAliasInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingMapping(null);
    setFormData(emptyFormData);
    setAliasInput("");
    setError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (mapping: ClientMapping) => {
    setEditingMapping(mapping);
    setFormData({
      code: mapping.code,
      displayName: mapping.displayName,
      qbCustomerName: mapping.qbCustomerName || "",
      aliases: [...mapping.aliases],
    });
    setAliasInput("");
    setError(null);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (mapping: ClientMapping) => {
    setDeletingMapping(mapping);
    setIsDeleteDialogOpen(true);
  };

  const addAlias = () => {
    const trimmed = aliasInput.trim();
    if (trimmed && !formData.aliases.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        aliases: [...prev.aliases, trimmed],
      }));
      setAliasInput("");
    }
  };

  const removeAlias = (alias: string) => {
    setFormData((prev) => ({
      ...prev,
      aliases: prev.aliases.filter((a) => a !== alias),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.displayName) {
      setError("Code and display name are required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = editingMapping
        ? `/api/client-mappings/${editingMapping.id}`
        : "/api/client-mappings";
      const method = editingMapping ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save mapping");
      }

      setIsDialogOpen(false);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMapping) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/client-mappings/${deletingMapping.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete mapping");
      }

      setIsDeleteDialogOpen(false);
      setDeletingMapping(null);
      onUpdate?.();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Client Mappings</CardTitle>
              <CardDescription>
                Map project client codes to QuickBooks customer names
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Mapping
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead className="hidden sm:table-cell">
                  QuickBooks Name
                </TableHead>
                <TableHead className="hidden md:table-cell">Aliases</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No client mappings yet. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-mono font-bold">
                      {mapping.code}
                    </TableCell>
                    <TableCell>{mapping.displayName}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {mapping.qbCustomerName || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {mapping.aliases.length > 0 ? (
                          mapping.aliases.map((alias) => (
                            <Badge key={alias} variant="outline" className="text-xs">
                              {alias}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(mapping)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(mapping)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMapping ? "Edit Client Mapping" : "Add Client Mapping"}
            </DialogTitle>
            <DialogDescription>
              Map a project client code to its QuickBooks customer name and aliases.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Client Code *</Label>
              <Input
                id="code"
                placeholder="e.g., CD, ADR"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="e.g., Certified Demolition"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, displayName: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qbCustomerName">QuickBooks Customer Name</Label>
              <Input
                id="qbCustomerName"
                placeholder="e.g., Certified Demolition Inc."
                value={formData.qbCustomerName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, qbCustomerName: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Aliases</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add alias..."
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAlias();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addAlias}>
                  Add
                </Button>
              </div>
              {formData.aliases.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.aliases.map((alias) => (
                    <Badge key={alias} variant="secondary" className="gap-1">
                      {alias}
                      <button
                        type="button"
                        onClick={() => removeAlias(alias)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {editingMapping ? "Save Changes" : "Create Mapping"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client Mapping?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the mapping for &quot;{deletingMapping?.code}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

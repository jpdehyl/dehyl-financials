"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { EstimateCategory, EstimateLineItem } from "@/types";

interface LineItemEditorProps {
  lineItems: EstimateLineItem[];
  onChange: (lineItems: EstimateLineItem[]) => void;
  readOnly?: boolean;
}

const CATEGORIES: { value: EstimateCategory; label: string }[] = [
  { value: "labor", label: "Labor" },
  { value: "materials", label: "Materials" },
  { value: "equipment", label: "Equipment" },
  { value: "subcontractors", label: "Subcontractors" },
  { value: "permits", label: "Permits" },
  { value: "other", label: "Other" },
];

const UNITS = ["each", "hr", "day", "sqft", "lft", "cuyd", "load", "lump sum"];

export function LineItemEditor({ lineItems, onChange, readOnly = false }: LineItemEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addLineItem = () => {
    const newItem: EstimateLineItem = {
      id: `temp-${Date.now()}`,
      estimateId: "",
      category: "labor",
      description: "",
      quantity: 1,
      unit: "each",
      unitPrice: 0,
      totalPrice: 0,
      sortOrder: lineItems.length,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    onChange([...lineItems, newItem]);
    setEditingId(newItem.id);
  };

  const updateLineItem = (id: string, updates: Partial<EstimateLineItem>) => {
    onChange(
      lineItems.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        updated.totalPrice = updated.quantity * updated.unitPrice;
        return updated;
      })
    );
  };

  const deleteLineItem = (id: string) => {
    onChange(lineItems.filter((item) => item.id !== id));
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="w-[140px]">Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[80px] text-right">Qty</TableHead>
              <TableHead className="w-[100px]">Unit</TableHead>
              <TableHead className="w-[120px] text-right">Unit Price</TableHead>
              <TableHead className="w-[120px] text-right">Total</TableHead>
              {!readOnly && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={readOnly ? 7 : 8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No line items yet. Click &quot;Add Line Item&quot; to start.
                </TableCell>
              </TableRow>
            ) : (
              lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {!readOnly && (
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      <span className="capitalize">{item.category}</span>
                    ) : (
                      <Select
                        value={item.category}
                        onValueChange={(value) =>
                          updateLineItem(item.id, { category: value as EstimateCategory })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      item.description
                    ) : (
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(item.id, { description: e.target.value })
                        }
                        placeholder="Description"
                        className="h-8"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? (
                      item.quantity
                    ) : (
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })
                        }
                        className="h-8 text-right"
                        min={0}
                        step={0.5}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      item.unit
                    ) : (
                      <Select
                        value={item.unit}
                        onValueChange={(value) => updateLineItem(item.id, { unit: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? (
                      formatCurrency(item.unitPrice)
                    ) : (
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })
                        }
                        className="h-8 text-right"
                        min={0}
                        step={0.01}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteLineItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with total and add button */}
      <div className="flex items-center justify-between">
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={addLineItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Line Item
          </Button>
        )}
        <div className={readOnly ? "ml-auto" : ""}>
          <div className="text-right">
            <span className="text-muted-foreground mr-4">Total:</span>
            <span className="text-xl font-bold">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

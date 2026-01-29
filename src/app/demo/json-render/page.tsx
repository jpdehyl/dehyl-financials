"use client";

import { useState, useCallback } from "react";
import { JsonRenderer, type Dashboard } from "@/lib/json-render/renderer";
import { exampleDashboard } from "@/lib/json-render/examples";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JsonRenderDemoPage() {
  const [dashboard, setDashboard] = useState<Dashboard>(exampleDashboard);
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(exampleDashboard, null, 2));
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleApply = useCallback(() => {
    setError(null);
    setSuccess(false);

    try {
      const parsed = JSON.parse(jsonText);

      // Basic validation
      if (!parsed.version || parsed.version !== 1) {
        setError('Invalid dashboard: "version" must be 1');
        return;
      }

      if (!parsed.layout || !Array.isArray(parsed.layout)) {
        setError('Invalid dashboard: "layout" must be an array');
        return;
      }

      // Validate each component in layout has a "component" field
      const validateComponents = (components: unknown[]): boolean => {
        for (const comp of components) {
          if (typeof comp !== "object" || comp === null) {
            setError("Invalid component: each layout item must be an object");
            return false;
          }
          const c = comp as Record<string, unknown>;
          if (!c.component || typeof c.component !== "string") {
            setError('Invalid component: missing "component" field');
            return false;
          }
          // Recursively validate children if present
          if (c.children && Array.isArray(c.children)) {
            if (!validateComponents(c.children as unknown[])) {
              return false;
            }
          }
        }
        return true;
      };

      if (!validateComponents(parsed.layout)) {
        return;
      }

      setDashboard(parsed as Dashboard);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError(`Invalid JSON: ${e.message}`);
      } else {
        setError("An unexpected error occurred");
      }
    }
  }, [jsonText]);

  const handleReset = useCallback(() => {
    setJsonText(JSON.stringify(exampleDashboard, null, 2));
    setDashboard(exampleDashboard);
    setError(null);
    setSuccess(false);
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">JSON-Render Demo</h1>
        <p className="text-muted-foreground">
          This page demonstrates the json-render framework with all available components.
          Edit the JSON below to customize the dashboard.
        </p>
      </div>

      {/* JSON Editor Panel */}
      <Card className="mb-8">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setIsEditorOpen(!isEditorOpen)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Dashboard JSON Editor</CardTitle>
              <CardDescription>
                Edit the JSON configuration to customize the dashboard
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              {isEditorOpen ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>
        </CardHeader>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            isEditorOpen ? "max-h-[800px]" : "max-h-0"
          )}
        >
          <CardContent className="pt-0">
            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500 bg-green-50 p-4 text-sm text-green-600 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Dashboard updated successfully!</span>
              </div>
            )}

            {/* JSON Textarea */}
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className={cn(
                "w-full h-96 p-4 font-mono text-sm rounded-lg border resize-none",
                "bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary",
                error && "border-destructive focus:ring-destructive"
              )}
              spellCheck={false}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <Button onClick={handleApply}>Apply Changes</Button>
              <Button variant="outline" onClick={handleReset}>
                Reset to Default
              </Button>
            </div>

            {/* Schema Reference */}
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2 text-sm">Available Components:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                <span className="font-mono">kpi-card</span>
                <span className="font-mono">stat-card</span>
                <span className="font-mono">alert-item</span>
                <span className="font-mono">data-table</span>
                <span className="font-mono">line-chart</span>
                <span className="font-mono">bar-chart</span>
                <span className="font-mono">progress-card</span>
                <span className="font-mono">text-block</span>
                <span className="font-mono">grid</span>
                <span className="font-mono">stack</span>
                <span className="font-mono">card</span>
                <span className="font-mono">quick-actions</span>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Rendered Dashboard */}
      <div className="border rounded-lg p-6 bg-background">
        <JsonRenderer dashboard={dashboard} />
      </div>
    </div>
  );
}

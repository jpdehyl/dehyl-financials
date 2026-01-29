"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  dashboardPresets,
  getStoredPreset,
  setStoredPreset,
  type PresetKey,
} from "@/lib/json-render/presets";

interface PresetSelectorProps {
  onPresetChange: (preset: PresetKey) => void;
}

export function PresetSelector({ onPresetChange }: PresetSelectorProps) {
  const [currentPreset, setCurrentPreset] = useState<PresetKey>("executive");
  const [mounted, setMounted] = useState(false);

  // Load stored preset on mount
  useEffect(() => {
    setMounted(true);
    const stored = getStoredPreset();
    setCurrentPreset(stored);
    onPresetChange(stored);
  }, [onPresetChange]);

  const handleChange = (value: PresetKey) => {
    setCurrentPreset(value);
    setStoredPreset(value);
    onPresetChange(value);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={currentPreset} onValueChange={handleChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select view" />
      </SelectTrigger>
      <SelectContent>
        {Object.values(dashboardPresets).map((preset) => (
          <SelectItem key={preset.key} value={preset.key}>
            <div className="flex flex-col">
              <span>{preset.name}</span>
              <span className="text-xs text-muted-foreground">
                {preset.description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

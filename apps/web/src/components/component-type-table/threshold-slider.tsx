"use client";

import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Slider } from "@/components/ui/slider";

type ThresholdSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function ThresholdSlider({ value, onChange }: ThresholdSliderProps) {
  // Local state for immediate visual feedback
  const [localValue, setLocalValue] = useState(value);

  // Sync local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced callback to parent (300ms)
  const debouncedOnChange = useDebouncedCallback((newValue: number) => {
    onChange(newValue);
  }, 300);

  const handleValueChange = (values: number[]) => {
    const newValue = values[0] ?? value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  // Convert 0-1 range to 50-100 range for display
  const displayValue = Math.round(localValue * 100);

  return (
    <div className="flex min-w-[300px] items-center gap-4">
      <label
        className="whitespace-nowrap font-medium text-sm"
        htmlFor="threshold-slider"
      >
        Similarity Threshold:
      </label>
      <div className="flex flex-1 items-center gap-3">
        <Slider
          aria-label="Similarity threshold percentage"
          className="flex-1"
          id="threshold-slider"
          max={1.0}
          min={0.5}
          onValueChange={handleValueChange}
          step={0.05}
          value={[localValue]}
        />
        <span className="min-w-[3ch] text-right font-medium text-muted-foreground text-sm">
          {displayValue}%
        </span>
      </div>
    </div>
  );
}

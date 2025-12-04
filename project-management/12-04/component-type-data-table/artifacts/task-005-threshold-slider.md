# Task 005: Similarity Threshold Slider

## What
Add a debounced slider control that allows users to adjust the similarity threshold for grouping.

## Why
Different use cases may need stricter or looser grouping. Debouncing prevents excessive API calls during adjustment.

## Files to Touch
- `apps/web/src/components/component-type-table/threshold-slider.tsx` - Slider component
- `apps/web/src/components/component-type-table/index.tsx` - Integrate slider

## Implementation Details

### Slider Component
```tsx
import { Slider } from '@/components/ui/slider';
import { useDebouncedCallback } from 'use-debounce';

interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function ThresholdSlider({ value, onChange }: ThresholdSliderProps) {
  const debouncedOnChange = useDebouncedCallback(onChange, 300);

  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium">Similarity Threshold:</label>
      <Slider
        value={[value * 100]}
        onValueChange={([v]) => debouncedOnChange(v / 100)}
        min={50}
        max={100}
        step={5}
        className="w-48"
      />
      <span className="text-sm text-muted-foreground w-12">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}
```

### Placement
- Above the table, aligned right
- Next to CSV export button

### UX Considerations
- Show current value as percentage
- Min 50%, Max 100% (below 50% is too loose)
- Step of 5% for easy adjustment
- Debounce 300ms to prevent API spam

## Acceptance Criteria
- [ ] Slider renders with current threshold value
- [ ] Value changes are debounced (300ms)
- [ ] Table data updates after debounce
- [ ] Visual feedback shows current percentage
- [ ] Min/max bounds enforced (50-100%)

## Dependencies
- Task 003 (page integration for state management)
- May need to install `use-debounce` package

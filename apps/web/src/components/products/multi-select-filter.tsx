"use client";

import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MultiSelectFilterProps {
  title: string;
  options: string[];
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

export function MultiSelectFilter({
  title,
  options,
  selected,
  onSelectedChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
}: MultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const handleToggle = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onSelectedChange(newSelected);
  };

  const handleClearAll = () => {
    onSelectedChange([]);
  };

  const handleSelectAll = () => {
    onSelectedChange(filteredOptions);
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="w-[240px] justify-between"
          role="combobox"
          variant="outline"
        >
          <span className="truncate">
            {selected.length === 0
              ? placeholder
              : selected.length === 1
                ? selected[0]
                : `${title} (${selected.length})`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[240px] p-0">
        <Command>
          <CommandInput
            onValueChange={setSearchQuery}
            placeholder={searchPlaceholder}
            value={searchQuery}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <div className="flex items-center justify-between border-b px-2 py-1.5">
                <div className="flex gap-2">
                  {selected.length > 0 && (
                    <Button
                      className="h-7 px-2 text-xs"
                      onClick={handleClearAll}
                      size="sm"
                      variant="ghost"
                    >
                      Clear all
                    </Button>
                  )}
                  {filteredOptions.length > 0 &&
                    selected.length !== filteredOptions.length && (
                      <Button
                        className="h-7 px-2 text-xs"
                        onClick={handleSelectAll}
                        size="sm"
                        variant="ghost"
                      >
                        Select all
                      </Button>
                    )}
                </div>
                {selected.length > 0 && (
                  <Badge className="text-xs" variant="secondary">
                    {selected.length}
                  </Badge>
                )}
              </div>
            </CommandGroup>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <CommandItem
                    className="cursor-pointer"
                    key={option}
                    onSelect={() => handleToggle(option)}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="mr-2"
                      onCheckedChange={() => handleToggle(option)}
                    />
                    <span className={cn("flex-1", isSelected && "font-medium")}>
                      {option}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

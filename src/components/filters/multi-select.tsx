"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Option } from "./searchable-select";

interface MultiSelectProps {
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  values,
  onChange,
  placeholder = "Select…",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggle = (val: string) => {
    onChange(
      values.includes(val)
        ? values.filter((v) => v !== val)
        : [...values, val],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto min-h-9 w-full justify-between font-normal",
            className,
          )}
        >
          <span className="flex flex-wrap gap-1">
            {values.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              values.slice(0, 3).map((v) => (
                <Badge key={v} variant="secondary" className="rounded">
                  {options.find((o) => o.value === v)?.label ?? v}
                </Badge>
              ))
            )}
            {values.length > 3 && (
              <Badge variant="secondary" className="rounded">
                +{values.length - 3}
              </Badge>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {options.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.label}
                onSelect={() => toggle(opt.value)}
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    values.includes(opt.value) ? "opacity-100" : "opacity-0",
                  )}
                />
                {opt.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

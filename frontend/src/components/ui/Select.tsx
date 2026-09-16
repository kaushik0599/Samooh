"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label: string;
  hideLabel?: boolean;
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function Select({
  label,
  hideLabel,
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  error,
  className,
}: SelectProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={cn("text-label text-text-secondary", hideLabel && "sr-only")}>
        {label}
      </label>
      <RadixSelect.Root value={value} onValueChange={onValueChange}>
        <RadixSelect.Trigger
          id={id}
          aria-invalid={Boolean(error) || undefined}
          className={cn(
            "flex h-10 items-center justify-between gap-2 rounded-md border border-border",
            "bg-surface px-3 text-body text-text-primary",
            "transition-colors duration-fast ease-standard focus-visible:border-primary",
            error && "border-error",
            className
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className="z-50 overflow-hidden rounded-md border border-border bg-surface shadow-lg"
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-sm px-2.5 py-2 text-body-sm",
                    "text-text-primary outline-none",
                    "data-[highlighted]:bg-surface-secondary"
                  )}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator>
                    <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && (
        <p role="alert" className="text-caption text-error">
          {error}
        </p>
      )}
    </div>
  );
}

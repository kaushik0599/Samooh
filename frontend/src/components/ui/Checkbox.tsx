"use client";

import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function Checkbox({ label, checked, onCheckedChange, className }: CheckboxProps) {
  const id = useId();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <RadixCheckbox.Root
        id={id}
        checked={checked}
        onCheckedChange={(state) => onCheckedChange(state === true)}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border bg-surface",
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
          "transition-colors duration-fast ease-standard"
        )}
      >
        <RadixCheckbox.Indicator>
          <Check className="h-3 w-3 text-white" aria-hidden="true" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <label htmlFor={id} className="text-body-sm text-text-primary cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}

/** A grid/list of toggleable OptionCards behaving as a multi-select (see OptionCard). */
export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  legend: string;
}

export function MultiSelect({ options, values, onChange, legend }: MultiSelectProps) {
  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-label text-text-secondary">{legend}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-surface p-3",
              "transition-[transform,background-color,border-color] duration-fast ease-standard",
              "hover:-translate-y-0.5 hover:bg-surface-secondary",
              values.includes(option.value) && "border-primary bg-accent-bg hover:bg-accent-bg"
            )}
          >
            <input
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={() => toggle(option.value)}
              className="sr-only"
            />
            <div>
              <p className="text-body-sm font-medium text-text-primary">{option.label}</p>
              {option.description && (
                <p className="text-caption text-text-secondary">{option.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

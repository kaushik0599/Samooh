import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hideLabel?: boolean;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hideLabel, error, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className={cn("text-label text-text-secondary", hideLabel && "sr-only")}
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={cn(hintId, errorId) || undefined}
          className={cn(
            "h-10 rounded-md border border-border bg-surface px-3 text-body text-text-primary",
            "placeholder:text-text-secondary",
            "transition-colors duration-fast ease-standard",
            "focus-visible:border-primary",
            error && "border-error",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-caption text-text-secondary">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-caption text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

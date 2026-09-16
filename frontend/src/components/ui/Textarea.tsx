import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hideLabel?: boolean;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hideLabel, error, hint, id, rows = 4, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={cn(hintId, errorId) || undefined}
          className={cn(
            "rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary",
            "placeholder:text-text-secondary resize-y",
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
Textarea.displayName = "Textarea";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-sm hover:bg-primary-hover",
  secondary:
    "bg-surface text-text-primary border border-border hover:bg-surface-secondary",
  ghost: "text-text-primary hover:bg-surface-secondary",
  danger: "bg-error text-white hover:opacity-90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-body-sm rounded-md",
  md: "h-10 px-4 text-body rounded-md",
  lg: "h-12 px-6 text-body-lg rounded-lg",
};

/**
 * Shared visual styles so a non-<button> element that must be a real
 * <a> (e.g. a nav-styled Link, per section 9's "links are actual links")
 * can look identical to Button without invalid button-in-link nesting.
 */
export function buttonVariants(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 font-semibold",
    "transition-[background-color,transform,box-shadow] duration-fast ease-standard",
    "active:translate-y-px disabled:opacity-50 disabled:pointer-events-none disabled:active:translate-y-0",
    variantClasses[variant],
    sizeClasses[size]
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(buttonVariants(variant, size), className)}
        {...props}
      >
        {isLoading && (
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

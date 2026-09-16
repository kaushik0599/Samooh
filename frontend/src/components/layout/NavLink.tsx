"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface NavLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  onNavigate?: () => void;
  /** "sidebar" = horizontal icon+label row. "mobile" = stacked, for the bottom tab bar. */
  variant?: "sidebar" | "mobile";
}

export function NavLink({ href, label, icon: Icon, onNavigate, variant = "sidebar" }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "transition-colors duration-fast ease-standard",
        variant === "sidebar" &&
          cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-body-sm font-medium",
            isActive
              ? "bg-accent-bg text-primary"
              : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
          ),
        variant === "mobile" &&
          cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 text-caption",
            isActive ? "text-primary" : "text-text-secondary"
          )
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}

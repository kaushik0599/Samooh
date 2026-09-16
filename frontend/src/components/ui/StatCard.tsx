import type { ReactNode } from "react";
import { Card } from "./Card";
import { cn } from "@/lib/utils/cn";

export interface StatCardProps {
  label: string;
  value: string;
  trend?: { direction: "up" | "down" | "flat"; label: string };
  icon?: ReactNode;
}

export function StatCard({ label, value, trend, icon }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-label uppercase text-text-secondary">{label}</p>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-secondary text-primary">
            {icon}
          </span>
        )}
      </div>
      <p className="text-h2 tracking-tight text-text-primary">{value}</p>
      {trend && (
        <p
          className={cn(
            "text-caption",
            trend.direction === "up" && "text-success",
            trend.direction === "down" && "text-error",
            trend.direction === "flat" && "text-text-secondary"
          )}
        >
          {trend.label}
        </p>
      )}
    </Card>
  );
}

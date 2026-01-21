import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "income" | "expense";
  trend?: {
    value: number;
    label: string;
  };
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  trend,
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p
            className={cn(
              "mt-2 text-base font-display font-bold",
              variant === "income" && "text-income",
              variant === "expense" && "text-expense",
              variant === "default" && "text-foreground",
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-2 text-xs font-medium",
                trend.value >= 0 ? "text-income" : "text-expense",
              )}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            variant === "income" && "bg-income-muted",
            variant === "expense" && "bg-expense-muted",
            variant === "default" && "bg-secondary",
          )}
        >
          <Icon
            className={cn(
              "h-6 w-6",
              variant === "income" && "text-income",
              variant === "expense" && "text-expense",
              variant === "default" && "text-muted-foreground",
            )}
          />
        </div>
      </div>
    </div>
  );
}

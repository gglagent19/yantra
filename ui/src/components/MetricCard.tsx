import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/lib/router";

const ACCENT_COLORS = [
  "border-l-primary",       // blue - primary
  "border-l-tertiary",      // orange - tertiary
  "border-l-muted-foreground", // gray - neutral
  "border-l-green-500",     // green
] as const;

const ICON_BG_COLORS = [
  "bg-primary/10 text-primary",
  "bg-tertiary/10 text-tertiary",
  "bg-muted text-muted-foreground",
  "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
] as const;

interface MetricCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  description?: ReactNode;
  to?: string;
  onClick?: () => void;
  accentIndex?: number;
}

export function MetricCard({ icon: Icon, value, label, description, to, onClick, accentIndex }: MetricCardProps) {
  const isClickable = !!(to || onClick);
  const accentClass = accentIndex != null ? ACCENT_COLORS[accentIndex % ACCENT_COLORS.length] : "border-l-primary";
  const iconBgClass = accentIndex != null ? ICON_BG_COLORS[accentIndex % ICON_BG_COLORS.length] : "bg-primary/10 text-primary";

  const inner = (
    <div className={`h-full px-5 py-5 bg-card rounded-xl border-l-2 ${accentClass} transition-colors shadow-sm${isClickable ? " hover:bg-surface-container-high hover:shadow-md cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
          {label}
        </p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold font-headline text-foreground tracking-tight tabular-nums">
        {value}
      </p>
      {description && (
        <div className="text-xs text-secondary-foreground mt-1.5 hidden sm:block">{description}</div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="no-underline text-inherit h-full" onClick={onClick}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div className="h-full" onClick={onClick}>
        {inner}
      </div>
    );
  }

  return inner;
}

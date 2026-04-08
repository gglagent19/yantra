import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, message, action, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-surface-container-low p-5 mb-5 rounded-xl border border-border/10">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-5 max-w-md">{message}</p>
      {action && onAction && (
        <Button onClick={onAction} className="bg-gradient-to-br from-primary to-[#0061ff] text-primary-foreground hover:opacity-90 font-bold rounded-xl shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4 mr-1.5" />
          {action}
        </Button>
      )}
    </div>
  );
}

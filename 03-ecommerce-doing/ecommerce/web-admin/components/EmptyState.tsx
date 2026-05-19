import React from "react";
import { Button } from "@/components/modern-ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, actionDisabled }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border border-border/30 bg-muted/20 text-center">
      <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center mb-6 text-primary/60">
        {icon}
      </div>
      <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-8">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} disabled={actionDisabled} className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

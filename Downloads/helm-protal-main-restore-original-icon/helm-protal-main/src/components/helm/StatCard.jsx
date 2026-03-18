import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, icon: Icon, color = "primary", subtitle }) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
  };
  return (
    <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", colors[color])}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-muted-foreground text-sm">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </Card>
  );
}

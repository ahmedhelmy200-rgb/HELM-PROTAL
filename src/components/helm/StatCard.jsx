import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createPageUrl } from "@/utils";

export default function StatCard({ title, value, icon: Icon, color = "primary", subtitle, to, onClick, className = "" }) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
  };

  const content = (
    <Card className={cn(
      "p-5 flex items-center gap-4 hover:shadow-md transition-all",
      (to || onClick) && "cursor-pointer hover:-translate-y-0.5",
      className,
    )}>
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", colors[color])}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-muted-foreground text-sm">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {(to || onClick) && <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0" />}
    </Card>
  );

  if (to) return <Link to={createPageUrl(to)}>{content}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className="w-full text-right">{content}</button>;
  return content;
}

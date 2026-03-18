import React from "react";
import { Badge } from "@/components/ui/badge";

const statusStyles = {
  "جارية": "bg-success/10 text-success border-success/30",
  "متوقفة": "bg-warning/10 text-warning border-warning/30",
  "مكتملة": "bg-primary/10 text-primary border-primary/30",
  "مغلقة": "bg-muted text-muted-foreground border-border",
  "قادمة": "bg-primary/10 text-primary border-primary/30",
  "منعقدة": "bg-success/10 text-success border-success/30",
  "مؤجلة": "bg-warning/10 text-warning border-warning/30",
  "ملغية": "bg-destructive/10 text-destructive border-destructive/30",
  "معلقة": "bg-warning/10 text-warning border-warning/30",
  "جارية_مهمة": "bg-primary/10 text-primary border-primary/30",
  "نشط": "bg-success/10 text-success border-success/30",
  "غير نشط": "bg-muted text-muted-foreground border-border",
  "مسودة": "bg-muted text-muted-foreground border-border",
  "جاهز": "bg-primary/10 text-primary border-primary/30",
  "مقدم": "bg-success/10 text-success border-success/30",
  "مرفوض": "bg-destructive/10 text-destructive border-destructive/30",
};

const priorityStyles = {
  "عالية": "bg-destructive/10 text-destructive border-destructive/30",
  "متوسطة": "bg-warning/10 text-warning border-warning/30",
  "منخفضة": "bg-success/10 text-success border-success/30",
};

export default function StatusBadge({ status, isPriority = false }) {
  const styles = isPriority ? priorityStyles : statusStyles;
  return (
    <Badge variant="outline" className={`text-xs font-medium border ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </Badge>
  );
}

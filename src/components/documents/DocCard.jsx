import React from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, AlertTriangle, ScanText, CheckCircle2, Loader2 } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import StatusBadge from "../helm/StatusBadge";

const ocrStatusIcon = {
  "مكتمل": <CheckCircle2 className="h-3 w-3 text-success" />,
  "جارٍ المعالجة": <Loader2 className="h-3 w-3 text-primary animate-spin" />,
  "فشل": <AlertTriangle className="h-3 w-3 text-destructive" />,
};

export default function DocCard({ doc, onClick, searchQuery }) {
  const [opening, setOpening] = React.useState(false);

  const openDocument = async (event) => {
    event?.stopPropagation?.();
    if (!doc?.file_url && !doc?.file_url_ref) return;
    if (opening) return;
    setOpening(true);
    try {
      const latest = doc.id ? await base44.entities.Document.filter({ id: doc.id }, null, 1) : [];
      const candidate = latest?.[0]?.file_url_ref || latest?.[0]?.file_url || doc.file_url_ref || doc.file_url;
      const resolved = await base44.integrations.Core.ResolveFileUrl({ file_url: candidate });
      const target = resolved.file_url || latest?.[0]?.file_url || doc.file_url;
      if (!target) throw new Error('تعذر إنشاء رابط فتح المستند.');
      window.open(target, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error(error);
      toast({ title: 'تعذر فتح المستند', description: error?.message || 'تعذر فتح المستند حالياً.', variant: 'destructive' });
    } finally {
      setOpening(false);
    }
  };

  const getDeadlineWarning = () => {
    if (!doc.submission_deadline || doc.status === "مقدم") return null;
    const days = differenceInDays(new Date(doc.submission_deadline), new Date());
    if (isPast(new Date(doc.submission_deadline))) return { color: "text-destructive", msg: "انتهى الموعد" };
    if (days <= 2) return { color: "text-accent", msg: `${days} أيام` };
    return null;
  };
  const warning = getDeadlineWarning();

  const getOcrSnippet = () => {
    if (!searchQuery || !doc.ocr_text) return null;
    const idx = doc.ocr_text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return null;
    const start = Math.max(0, idx - 40);
    const end = Math.min(doc.ocr_text.length, idx + searchQuery.length + 40);
    const snippet = doc.ocr_text.slice(start, end);
    const parts = snippet.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={i} className="bg-accent/30 text-foreground rounded px-0.5">{part}</mark>
        : part
    );
  };
  const ocrSnippet = getOcrSnippet();

  return (
    <Card
      className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${warning ? "border-accent/30" : ""}`}
      onClick={() => onClick(doc)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm truncate">{doc.title}</h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{doc.doc_type}</span>
              {doc.case_title && <span className="text-xs text-muted-foreground">· {doc.case_title}</span>}
              {doc.folder && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{doc.folder}</Badge>}
            </div>
            {doc.submission_deadline && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${warning ? warning.color : "text-muted-foreground"}`}>
                {warning && <AlertTriangle className="h-3 w-3" />}
                الموعد: {format(new Date(doc.submission_deadline), "yyyy/MM/dd")}
                {warning && ` - ${warning.msg}`}
              </p>
            )}
            {ocrSnippet && (
              <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 rounded p-1.5 leading-relaxed line-clamp-2">
                <ScanText className="h-3 w-3 inline ml-1 text-primary" />
                ...{ocrSnippet}...
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end shrink-0">
          <StatusBadge status={doc.status} />
          {doc.ocr_status && doc.ocr_status !== "لم يُعالج" && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              {ocrStatusIcon[doc.ocr_status]}
              OCR
            </span>
          )}
          {(doc.file_url || doc.file_url_ref) && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={openDocument} disabled={opening} title="فتح المستند">
              {opening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

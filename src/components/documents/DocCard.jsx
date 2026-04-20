import React from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, ExternalLink, AlertTriangle, ScanText,
  CheckCircle2, Loader2, Pencil, FileX,
} from "lucide-react";
import { format, isPast, differenceInDays, isValid } from "date-fns";
import StatusBadge from "../helm/StatusBadge";

const OCR_ICONS = {
  "مكتمل":          <CheckCircle2 className="h-3 w-3 text-success" />,
  "جارٍ المعالجة":  <Loader2 className="h-3 w-3 text-primary animate-spin" />,
  "فشل":            <AlertTriangle className="h-3 w-3 text-destructive" />,
};

// أيقونة نوع الملف
function FileTypeIcon({ fileName }) {
  const ext = String(fileName || "").split(".").pop().toLowerCase();
  const colors = {
    pdf:  "bg-red-100    text-red-600    dark:bg-red-900/30    dark:text-red-300",
    doc:  "bg-blue-100   text-blue-600   dark:bg-blue-900/30   dark:text-blue-300",
    docx: "bg-blue-100   text-blue-600   dark:bg-blue-900/30   dark:text-blue-300",
    xls:  "bg-green-100  text-green-600  dark:bg-green-900/30  dark:text-green-300",
    xlsx: "bg-green-100  text-green-600  dark:bg-green-900/30  dark:text-green-300",
    jpg:  "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
    jpeg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
    png:  "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return (
    <div className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${colors[ext] || "bg-primary/10 text-primary"}`}>
      <FileText className="h-5 w-5" />
      {ext && <span className="text-[9px] font-bold uppercase mt-0.5 leading-none">{ext}</span>}
    </div>
  );
}

export default function DocCard({ doc, onEdit, searchQuery }) {
  const [opening, setOpening] = React.useState(false);
  const hasFile = !!(doc?.file_url || doc?.file_url_ref);

  // ── فتح المستند ───────────────────────────────────────────────────────────
  const openDocument = async (e) => {
    e?.stopPropagation?.();
    if (!hasFile || opening) return;
    setOpening(true);
    try {
      // جلب رابط موقّع حديث من Supabase Storage
      const latest    = doc.id ? await base44.entities.Document.filter({ id: doc.id }, null, 1) : [];
      const candidate = latest?.[0]?.file_url_ref
                     || latest?.[0]?.file_url
                     || doc.file_url_ref
                     || doc.file_url;
      const resolved  = await base44.integrations.Core.ResolveFileUrl({ file_url: candidate });
      const target    = resolved?.file_url || candidate;
      if (!target) throw new Error("تعذر إنشاء رابط الملف.");
      window.open(target, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast({ title: "تعذر فتح المستند", description: err?.message || "خطأ غير متوقع.", variant: "destructive" });
    } finally {
      setOpening(false);
    }
  };

  // ── تحذير الموعد ──────────────────────────────────────────────────────────
  const warning = React.useMemo(() => {
    if (!doc.submission_deadline || doc.status === "مقدم") return null;
    const d    = new Date(doc.submission_deadline);
    if (!isValid(d)) return null;
    const days = differenceInDays(d, new Date());
    if (isPast(d))   return { color: "text-destructive", msg: "انتهى الموعد" };
    if (days <= 2)   return { color: "text-accent",      msg: `${days} أيام`  };
    return null;
  }, [doc.submission_deadline, doc.status]);

  // ── مقتطف OCR ────────────────────────────────────────────────────────────
  const ocrSnippet = React.useMemo(() => {
    if (!searchQuery || !doc.ocr_text) return null;
    const q   = searchQuery.toLowerCase();
    const idx = doc.ocr_text.toLowerCase().indexOf(q);
    if (idx === -1) return null;
    const start   = Math.max(0, idx - 40);
    const end     = Math.min(doc.ocr_text.length, idx + q.length + 40);
    const snippet = doc.ocr_text.slice(start, end);
    return snippet.split(new RegExp(`(${searchQuery})`, "gi")).map((part, i) =>
      part.toLowerCase() === q
        ? <mark key={i} className="bg-accent/30 text-foreground rounded px-0.5">{part}</mark>
        : part
    );
  }, [searchQuery, doc.ocr_text]);

  return (
    <Card
      className={`p-4 transition-all group ${hasFile ? "cursor-pointer hover:shadow-md hover:border-primary/30" : "hover:shadow-sm"} ${warning ? "border-accent/30" : ""}`}
      onClick={hasFile ? openDocument : undefined}
      title={hasFile ? "انقر لفتح المستند" : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        {/* ── الجانب الأيمن: الأيقونة + المعلومات ── */}
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="relative shrink-0">
            <FileTypeIcon fileName={doc.file_name} />
            {hasFile && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-primary/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
              {doc.title}
            </h3>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{doc.doc_type}</span>
              {doc.case_title  && <span className="text-xs text-muted-foreground">· {doc.case_title}</span>}
              {doc.client_name && <span className="text-xs text-muted-foreground">· {doc.client_name}</span>}
              {doc.folder      && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{doc.folder}</Badge>}
            </div>

            {doc.file_name && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{doc.file_name}</p>
            )}

            {doc.submission_deadline && isValid(new Date(doc.submission_deadline)) && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${warning ? warning.color : "text-muted-foreground"}`}>
                {warning && <AlertTriangle className="h-3 w-3" />}
                الموعد: {format(new Date(doc.submission_deadline), "yyyy/MM/dd")}
                {warning && ` — ${warning.msg}`}
              </p>
            )}

            {ocrSnippet && (
              <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 rounded-lg p-1.5 leading-relaxed line-clamp-2">
                <ScanText className="h-3 w-3 inline ml-1 text-primary" />
                …{ocrSnippet}…
              </p>
            )}

            {!hasFile && (
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <FileX className="h-3 w-3" /> لا يوجد ملف مرفق
              </p>
            )}
          </div>
        </div>

        {/* ── الجانب الأيسر: الحالة + زر التعديل ── */}
        <div className="flex flex-col gap-2 items-end shrink-0">
          <StatusBadge status={doc.status} />

          {doc.ocr_status && doc.ocr_status !== "لم يُعالج" && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              {OCR_ICONS[doc.ocr_status]} OCR
            </span>
          )}

          {/* زر تعديل البيانات — منفصل عن فتح الملف */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onEdit?.(doc); }}
            title="تعديل بيانات المستند"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          {/* مؤشر تحميل عند فتح الملف */}
          {opening && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          )}
        </div>
      </div>
    </Card>
  );
}

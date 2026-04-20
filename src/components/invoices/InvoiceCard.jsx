import ActionButtons from "@/components/shared/ActionButtons";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Download, Edit, Trash2, CheckCircle,
  MessageCircle, Mail, BellRing, Link2, Copy, CheckCircle2,
} from "lucide-react";
import { format, isValid } from "date-fns";
import { buildPaymentUrl, buildPaymentWhatsAppMessage } from "@/lib/paymentLinks";

const STATUS_STYLES = {
  "مدفوعة":         "bg-green-100  text-green-700  border-green-200  dark:bg-green-900/30  dark:text-green-300",
  "مدفوعة جزئياً": "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
  "متأخرة":         "bg-red-100    text-red-700    border-red-200    dark:bg-red-900/30    dark:text-red-300",
  "صادرة":          "bg-blue-100   text-blue-700   border-blue-200   dark:bg-blue-900/30   dark:text-blue-300",
  "مسودة":          "bg-gray-100   text-gray-600   border-gray-200   dark:bg-gray-800      dark:text-gray-400",
  "ملغاة":          "bg-gray-100   text-gray-400   border-gray-200   dark:bg-gray-800      dark:text-gray-500",
};

function safeFmt(v, pat) {
  if (!v) return ""
  try { const d = new Date(v); return isValid(d) ? format(d, pat) : "" } catch { return "" }
}

export default function InvoiceCard({
  invoice,
  onEdit,
  onDelete,
  onPrint,
  onMarkPaid,
  onSendWhatsApp,
  onSendEmail,
  onSendReminder,
  officeSettings,
  isClient = false,
  readOnly = false,
}) {
  const [linkCopied, setLinkCopied] = useState(false);

  const subtotal    = (invoice.total_fees || 0) - (invoice.discount || 0);
  const vat         = subtotal * ((invoice.vat_rate || 0) / 100);
  const total       = subtotal + vat;
  const remaining   = Math.max(0, total - (invoice.paid_amount || 0));
  const progressPct = total > 0 ? Math.min(100, Math.round(((invoice.paid_amount || 0) / total) * 100)) : 0;
  const isPaid      = invoice.status === "مدفوعة" || remaining <= 0;

  // ── رابط الدفع ──────────────────────────────────────────────────────────
  const paymentUrl = buildPaymentUrl(invoice.id);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(paymentUrl).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleSendPaymentWhatsApp = () => {
    const msg = buildPaymentWhatsAppMessage(invoice, paymentUrl, officeSettings);
    const phone = String(
      (officeSettings
        ? (() => {
            // نحاول إيجاد رقم الموكل من clientLookup إذا متاح
            return "";
          })()
        : "") || ""
    ).replace(/\D+/g, "");
    const encoded = encodeURIComponent(msg);
    window.open(phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-all hover:-translate-y-0.5 border border-border">
      {/* ── رأس البطاقة ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${progressPct === 100 ? "bg-green-500/15" : progressPct > 0 ? "bg-amber-500/15" : "bg-primary/10"}`}>
            <FileText className={`h-6 w-6 ${progressPct === 100 ? "text-green-500" : progressPct > 0 ? "text-amber-500" : "text-primary"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-sm text-foreground">{invoice.invoice_number || "فاتورة"}</span>
              <Badge className={`text-xs border ${STATUS_STYLES[invoice.status] || STATUS_STYLES["مسودة"]}`}>{invoice.status}</Badge>
            </div>
            <p className="font-semibold text-foreground leading-tight">{invoice.client_name}</p>
            {invoice.case_title && <p className="text-xs text-muted-foreground mt-0.5">⚖️ {invoice.case_title}</p>}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
              {invoice.issue_date && <span>📅 {safeFmt(invoice.issue_date, "yyyy/MM/dd")}</span>}
              {invoice.due_date   && <span>· ⏰ {safeFmt(invoice.due_date,  "yyyy/MM/dd")}</span>}
            </div>
          </div>
        </div>

        {/* المبالغ */}
        <div className="text-left shrink-0 min-w-[130px]">
          <p className="text-xl font-extrabold text-primary">{total.toLocaleString("ar")}</p>
          <p className="text-xs text-muted-foreground">د.إ إجمالي</p>
          <p className="text-xs text-green-600 font-medium mt-1">✓ {(invoice.paid_amount || 0).toLocaleString("ar")}</p>
          {remaining > 0 && <p className="text-xs text-destructive font-medium">▸ {remaining.toLocaleString("ar")} متبقي</p>}
        </div>
      </div>

      {/* ── شريط التقدم ───────────────────────────────────────────────────── */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>نسبة السداد</span>
          <span className={`font-semibold ${progressPct === 100 ? "text-green-500" : progressPct >= 50 ? "text-amber-500" : "text-primary"}`}>{progressPct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{
            width: `${progressPct}%`,
            background: progressPct === 100 ? "#22c55e" : progressPct >= 50 ? "#f59e0b" : "hsl(var(--primary))",
          }} />
        </div>
      </div>

      {/* ── رابط الدفع — يظهر للفواتير غير المدفوعة ──────────────────────── */}
      {!isPaid && (
        <div className="mb-3 p-3 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link2 className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-foreground font-medium">رابط الدفع الإلكتروني</span>
            <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">{paymentUrl.slice(0, 40)}…</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isClient ? (
              /* زر ادفع الآن للموكّل — بارز وواضح */
              <a
                href={paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors shadow-sm"
              >
                💳 ادفع الآن
              </a>
            ) : (
              <>
                <Button
                  variant="ghost" size="sm"
                  className="h-7 gap-1 text-xs text-primary hover:bg-primary/10"
                  onClick={handleCopyLink}
                >
                  {linkCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {linkCopied ? "تم النسخ" : "نسخ"}
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="h-7 gap-1 text-xs text-green-600 hover:bg-green-500/10"
                  onClick={handleSendPaymentWhatsApp}
                  title="إرسال رابط الدفع عبر واتساب"
                >
                  <MessageCircle className="h-3.5 w-3.5" />واتساب
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── أزرار الإجراءات ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border">
        <Button variant="outline" size="sm" onClick={() => onPrint(invoice)} className="gap-1 text-xs h-8">
          <Download className="h-3.5 w-3.5" /> طباعة
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSendWhatsApp?.(invoice)} className="gap-1 text-xs h-8 text-green-700 border-green-300/50 hover:bg-green-500/8">
          <MessageCircle className="h-3.5 w-3.5" /> واتساب
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSendEmail?.(invoice)} className="gap-1 text-xs h-8">
          <Mail className="h-3.5 w-3.5" /> بريد
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onSendReminder?.(invoice)} className="gap-1 text-xs h-8 text-amber-600">
          <BellRing className="h-3.5 w-3.5" /> تذكير
        </Button>
        {!readOnly && !isPaid && (
          <Button variant="outline" size="sm" onClick={() => onMarkPaid(invoice)} className="gap-1 text-xs h-8 text-green-700 border-green-300/50 hover:bg-green-500/8">
            <CheckCircle className="h-3.5 w-3.5" /> دفع
          </Button>
        )}
        {!readOnly && (
          <>
            <Button variant="ghost" size="icon" onClick={() => onEdit(invoice)} className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(invoice.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

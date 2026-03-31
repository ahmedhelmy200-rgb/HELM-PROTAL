import ActionButtons from "@/components/shared/ActionButtons";
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Edit, Trash2, CheckCircle, MessageCircle, Mail, BellRing } from "lucide-react";
import { format } from "date-fns";

const STATUS_STYLES = {
  "مدفوعة": "bg-green-100 text-green-700 border-green-200",
  "مدفوعة جزئياً": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "متأخرة": "bg-red-100 text-red-700 border-red-200",
  "صادرة": "bg-blue-100 text-blue-700 border-blue-200",
  "مسودة": "bg-gray-100 text-gray-600 border-gray-200",
  "ملغاة": "bg-gray-100 text-gray-400 border-gray-200"
};

export default function InvoiceCard({
  invoice,
  onEdit,
  onDelete,
  onPrint,
  onMarkPaid,
  onSendWhatsApp,
  onSendEmail,
  onSendReminder,
  readOnly = false,
}) {
  const subtotal = (invoice.total_fees || 0) - (invoice.discount || 0);
  const vat = subtotal * ((invoice.vat_rate || 0) / 100);
  const total = subtotal + vat;
  const remaining = Math.max(0, total - (invoice.paid_amount || 0));
  const progressPct = total > 0 ? Math.min(100, Math.round(((invoice.paid_amount || 0) / total) * 100)) : 0;

  return (
    <Card className="p-4 hover:shadow-lg transition-all hover:-translate-y-0.5 border border-border">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${progressPct === 100 ? "bg-green-100" : progressPct > 0 ? "bg-yellow-100" : "bg-primary/10"}`}>
            <FileText className={`h-6 w-6 ${progressPct === 100 ? "text-green-600" : progressPct > 0 ? "text-yellow-600" : "text-primary"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-sm text-foreground">{invoice.invoice_number || 'فاتورة'}</span>
              <Badge className={`text-xs border ${STATUS_STYLES[invoice.status] || STATUS_STYLES["مسودة"]}`}>{invoice.status}</Badge>
            </div>
            <p className="text-base font-semibold text-foreground leading-tight">{invoice.client_name}</p>
            {invoice.case_title && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">⚖️ {invoice.case_title}</p>}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
              {invoice.issue_date && <span>📅 {format(new Date(invoice.issue_date), "yyyy/MM/dd")}</span>}
              {invoice.due_date && <span>· ⏰ {format(new Date(invoice.due_date), "yyyy/MM/dd")}</span>}
            </div>
          </div>
        </div>
        <div className="text-left shrink-0 min-w-[140px]">
          <p className="text-xl font-extrabold text-primary">{total.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">د.إ إجمالي</p>
          <p className="text-xs text-green-600 font-medium mt-1">✓ {(invoice.paid_amount || 0).toLocaleString()}</p>
          {remaining > 0 && <p className="text-xs text-red-500 font-medium">▸ {remaining.toLocaleString()} متبقي</p>}
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>نسبة السداد</span>
          <span className={`font-semibold ${progressPct === 100 ? "text-green-600" : progressPct >= 50 ? "text-yellow-600" : "text-primary"}`}>{progressPct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: progressPct === 100 ? "#16a34a" : progressPct >= 50 ? "#d97706" : "#1d4ed8" }} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
        <Button variant="outline" size="sm" onClick={() => onPrint(invoice)} className="gap-1 text-xs flex-1 sm:flex-none">
          <Download className="h-3 w-3" /> طباعة
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSendWhatsApp?.(invoice)} className="gap-1 text-xs text-green-600 border-green-200 hover:bg-green-50" title="إرسال عبر واتساب">
          <MessageCircle className="h-3 w-3" /> واتساب
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSendEmail?.(invoice)} className="gap-1 text-xs" title="إرسال عبر البريد">
          <Mail className="h-3 w-3" /> بريد
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onSendReminder?.(invoice)} className="gap-1 text-xs text-amber-700" title="إرسال تذكير">
          <BellRing className="h-3 w-3" /> تذكير
        </Button>
        {!readOnly && invoice.status !== "مدفوعة" && invoice.status !== "ملغاة" && (
          <Button variant="outline" size="sm" onClick={() => onMarkPaid(invoice)} className="gap-1 text-xs text-green-700 border-green-300 hover:bg-green-50">
            <CheckCircle className="h-3 w-3" /> دفع
          </Button>
        )}
        {!readOnly && <Button variant="ghost" size="icon" onClick={() => onEdit(invoice)} className="h-8 w-8"><Edit className="h-3.5 w-3.5" /></Button>}
        {!readOnly && <Button variant="ghost" size="icon" onClick={() => onDelete(invoice.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>}
      </div>
    </Card>
  );
}

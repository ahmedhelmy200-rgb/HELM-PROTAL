import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Search, FileText, TrendingUp, DollarSign, AlertCircle, X, Send, Mail, MessageCircle } from "lucide-react";
import PageHeader from "../components/helm/PageHeader";
import EmptyState from "../components/helm/EmptyState";
import InvoiceCard from "../components/invoices/InvoiceCard";
import InvoiceFormDialog from "../components/invoices/InvoiceFormDialog";
import InvoicePDF from "../components/invoices/InvoicePDF";
import { useAuth } from "@/lib/AuthContext";

export default function Invoices() {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [officeSettings, setOfficeSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const STATUSES = ["مسودة", "صادرة", "مدفوعة جزئياً", "مدفوعة", "متأخرة", "ملغاة"];

  useEffect(() => { loadInvoices(); }, []);

  const loadInvoices = async () => {
    setLoading(true);
    const [invoiceRows, clientRows, settings] = await Promise.all([
      base44.entities.Invoice.list("-created_date"),
      base44.entities.Client.list(),
      base44.entities.OfficeSettings.list(),
    ]);
    setInvoices(invoiceRows);
    setClients(clientRows);
    setOfficeSettings(settings?.[0] || null);
    setLoading(false);
  };

  const clientLookup = useMemo(() => Object.fromEntries(clients.map((client) => [client.full_name, client])), [clients]);

  const handleEdit = (inv) => { setEditing(inv); setShowForm(true); };
  const handleCreate = () => { setEditing(null); setShowForm(true); };

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) return;
    await base44.entities.Invoice.delete(id);
    await loadInvoices();
  };

  const handleMarkPaid = async (inv) => {
    const subtotal = (inv.total_fees || 0) - (inv.discount || 0);
    const vat = subtotal * ((inv.vat_rate || 0) / 100);
    const total = subtotal + vat;
    await base44.entities.Invoice.update(inv.id, {
      paid_amount: total,
      status: "مدفوعة",
    });
    await loadInvoices();
  };

  const handlePrint = (inv) => setPreviewInvoice(inv);

  const buildInvoiceMessage = (invoice) => {
    const subtotal = (invoice.total_fees || 0) - (invoice.discount || 0);
    const vat = subtotal * ((invoice.vat_rate || 0) / 100);
    const total = subtotal + vat;
    const remaining = Math.max(0, total - (invoice.paid_amount || 0));
    return `مرحباً ${invoice.client_name || ''}،\n\nبخصوص الفاتورة رقم ${invoice.invoice_number || ''}:\nإجمالي الفاتورة: ${total.toLocaleString()} د.إ\nالمدفوع: ${(invoice.paid_amount || 0).toLocaleString()} د.إ\nالمتبقي: ${remaining.toLocaleString()} د.إ\n${invoice.due_date ? `تاريخ الاستحقاق: ${invoice.due_date}\n` : ''}\nنرجو السداد أو التواصل معنا عند الحاجة.`;
  };

  const handleSendWhatsApp = (invoice) => {
    const client = clientLookup[invoice.client_name] || {};
    const phone = String(client.phone || '').replace(/\D+/g, '');
    const text = encodeURIComponent(buildInvoiceMessage(invoice));
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
      return;
    }
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleSendEmail = (invoice) => {
    const client = clientLookup[invoice.client_name] || {};
    const subject = encodeURIComponent(`فاتورة ${invoice.invoice_number || ''}`);
    const body = encodeURIComponent(`${buildInvoiceMessage(invoice)}\n\n${officeSettings?.office_name || ''}\n${officeSettings?.phone || ''}`);
    if (client.email) {
      window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
      return;
    }
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleSendReminder = async (invoice) => {
    const officeEmail = officeSettings?.email;
    if (officeEmail) {
      await base44.entities.Notification.create({
        title: 'تذكير متابعة فاتورة',
        message: `متابعة الفاتورة ${invoice.invoice_number || ''} للموكل ${invoice.client_name || ''}`,
        type: 'عام',
        reference_id: invoice.id,
        reference_type: 'Invoice',
        user_email: officeEmail,
      });
    }
    handleSendWhatsApp(invoice);
  };

  const printInvoice = () => {
    const printContent = document.getElementById("invoice-print-area");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=900,height=1200");
    win.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة ${previewInvoice?.invoice_number || ""}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            @page { margin: 0; }
            body { margin: 0; padding: 0; font-family: 'Cairo', Arial, sans-serif; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      inv.client_name?.toLowerCase().includes(q) ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.case_title?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "الكل" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalFees = invoices.reduce((s, inv) => {
    const sub = (inv.total_fees || 0) - (inv.discount || 0);
    const vat = sub * ((inv.vat_rate || 0) / 100);
    return s + sub + vat;
  }, 0);
  const totalPaid = invoices.reduce((s, inv) => s + (inv.paid_amount || 0), 0);
  const totalRemaining = Math.max(0, totalFees - totalPaid);
  const overdueCount = invoices.filter(inv => inv.status === "متأخرة").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الفواتير"
        subtitle={`${invoices.length} فاتورة`}
        action={
          !isClient ? <Button onClick={handleCreate} className="bg-primary text-white gap-2">
            <Plus className="h-4 w-4" /> إنشاء فاتورة
          </Button> : undefined
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إجمالي الأتعاب</p>
              <p className="text-lg font-bold text-foreground">{totalFees.toLocaleString()} <span className="text-xs font-normal">د.إ</span></p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المبالغ المحصلة</p>
              <p className="text-lg font-bold text-green-600">{totalPaid.toLocaleString()} <span className="text-xs font-normal">د.إ</span></p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المبالغ المتبقية</p>
              <p className="text-lg font-bold text-red-500">{totalRemaining.toLocaleString()} <span className="text-xs font-normal">د.إ</span></p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">فواتير متأخرة</p>
              <p className="text-lg font-bold text-yellow-600">{overdueCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {!isClient && (
        <Card className="p-4 border-primary/10 bg-primary/5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">إرسال سريع للموكلين</h3>
              <p className="text-sm text-muted-foreground">تم تفعيل أزرار واتساب والبريد والتذكير على كل فاتورة. البريد يعمل عبر mailto والواتساب عبر الرابط المباشر.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2"><MessageCircle className="h-4 w-4" /> واتساب</Button>
              <Button variant="outline" className="gap-2"><Mail className="h-4 w-4" /> بريد</Button>
              <Button variant="outline" className="gap-2"><Send className="h-4 w-4" /> تذكير</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالموكل أو رقم الفاتورة أو القضية..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10 h-11"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل">كل الحالات</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="لا توجد فواتير"
          description="ابدأ بإنشاء أول فاتورة للموكلين"
          action={!isClient ? <Button onClick={handleCreate}>إنشاء فاتورة</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(inv => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPrint={handlePrint}
              onMarkPaid={handleMarkPaid}
              onSendWhatsApp={handleSendWhatsApp}
              onSendEmail={handleSendEmail}
              onSendReminder={handleSendReminder}
              readOnly={isClient}
            />
          ))}
        </div>
      )}

      {!isClient && <InvoiceFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        invoice={editing}
        onSaved={loadInvoices}
      />}

      <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
        <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto p-0" dir="rtl">
          <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
            <h2 className="font-bold text-foreground">معاينة الفاتورة</h2>
            <div className="flex items-center gap-2">
              <Button onClick={printInvoice} className="bg-primary text-white gap-2">
                <FileText className="h-4 w-4" /> طباعة / تصدير PDF
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setPreviewInvoice(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-4 bg-gray-50">
            <div className="shadow-lg mx-auto" style={{ maxWidth: "794px" }}>
              {previewInvoice && <InvoicePDF invoice={previewInvoice} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

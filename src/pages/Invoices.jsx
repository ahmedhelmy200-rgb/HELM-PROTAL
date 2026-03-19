import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Search, FileText, TrendingUp, DollarSign, AlertCircle, X } from "lucide-react";
import { format } from "date-fns";
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
    const data = await base44.entities.Invoice.list("-created_date");
    setInvoices(data);
    setLoading(false);
  };

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

  const handlePrint = (inv) => {
    setPreviewInvoice(inv);
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

  // Filter
  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      inv.client_name?.toLowerCase().includes(q) ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.case_title?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "الكل" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const totalFees = invoices.reduce((s, inv) => {
    const sub = (inv.total_fees || 0) - (inv.discount || 0);
    const vat = sub * ((inv.vat_rate || 0) / 100);
    return s + sub + vat;
  }, 0);
  const totalPaid = invoices.reduce((s, inv) => s + (inv.paid_amount || 0), 0);
  const totalRemaining = totalFees - totalPaid;
  const overdueCount = invoices.filter(inv => inv.status === "متأخرة").length;

  return (
    <div>
      <PageHeader
        title="الفواتير"
        subtitle={`${invoices.length} فاتورة`}
        action={
          !isClient ? <Button onClick={handleCreate} className="bg-primary text-white gap-2">
            <Plus className="h-4 w-4" /> إنشاء فاتورة
          </Button> : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالموكل أو رقم الفاتورة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل">كل الحالات</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
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
              readOnly={isClient}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      {!isClient && <InvoiceFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        invoice={editing}
        onSaved={loadInvoices}
      />}

      {/* PDF Preview Dialog */}
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
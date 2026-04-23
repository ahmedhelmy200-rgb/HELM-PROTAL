import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ChoiceInput from "@/components/shared/ChoiceInput";
import DateSmartInput from "@/components/shared/DateSmartInput";

const emptyForm = {
  invoice_number: "",
  client_name: "",
  case_id: "",
  case_title: "",
  case_number: "",
  issue_date: new Date().toISOString().split("T")[0],
  due_date: "",
  total_fees: "",
  paid_amount: "",
  discount: "",
  vat_rate: "5",
  status: "مسودة",
  items: [],
  notes: "",
  payment_method: "",
  office_name: "",
  office_phone: "",
  office_address: "",
};

const STATUSES = ["مسودة", "صادرة", "مدفوعة جزئياً", "مدفوعة", "متأخرة", "ملغاة"];
const PAYMENT_METHODS = ["نقداً", "تحويل بنكي", "شيك", "بطاقة ائتمان", "رابط دفع", "أخرى"];

export default function InvoiceFormDialog({ open, onOpenChange, invoice, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [officeSettings, setOfficeSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [caseRows, clientRows, settings] = await Promise.all([
        base44.entities.Case.list(),
        base44.entities.Client.list(),
        base44.entities.OfficeSettings.list(),
      ]);
      setCases(caseRows);
      setClients(clientRows);
      setOfficeSettings(settings?.[0] || null);
    };
    if (open) load();
  }, [open]);

  useEffect(() => {
    if (invoice) {
      setForm({ ...emptyForm, ...invoice, items: invoice.items || [] });
      return;
    }
    setForm({
      ...emptyForm,
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      office_name: officeSettings?.office_name || "",
      office_phone: officeSettings?.phone || "",
      office_address: officeSettings?.address || "",
    });
  }, [invoice, open, officeSettings]);

  const handleCaseSelect = (caseTitle) => {
    const selected = cases.find((item) => item.title === caseTitle || item.id === caseTitle);
    if (!selected) {
      setForm((prev) => ({ ...prev, case_title: caseTitle, case_id: "" }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      case_id: selected.id,
      case_title: selected.title,
      case_number: selected.case_number || "",
      client_name: selected.client_name || prev.client_name,
      total_fees: selected.fees ? String(selected.fees) : prev.total_fees,
      paid_amount: selected.paid_amount ? String(selected.paid_amount) : prev.paid_amount,
    }));
  };

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, { description: "", amount: "" }] }));
  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: field === "amount" ? (value === "" ? "" : Number(value)) : value };
    setForm((prev) => ({ ...prev, items }));
  };
  const removeItem = (index) => setForm((prev) => ({ ...prev, items: prev.items.filter((_, itemIndex) => itemIndex !== index) }));
  const itemsTotal = form.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        total_fees: form.items.length > 0 ? itemsTotal : (Number(form.total_fees) || 0),
        paid_amount: Number(form.paid_amount) || 0,
        discount: Number(form.discount) || 0,
        vat_rate: Number(form.vat_rate) || 0,
        items: form.items.map((item) => ({ ...item, amount: Number(item.amount) || 0 })),
      };
      if (invoice) await base44.entities.Invoice.update(invoice.id, payload);
      else await base44.entities.Invoice.create(payload);
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{invoice ? "تعديل الفاتورة" : "إنشاء فاتورة جديدة"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>رقم الفاتورة</Label><Input value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} className="h-11" /></div>
            <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={STATUSES} listId="invoice-statuses" /></div>
            <div className="space-y-1"><Label>تاريخ الإصدار *</Label><DateSmartInput type="date" value={form.issue_date} onChange={v => setForm(f => ({ ...f, issue_date: v }))} /></div>
            <div className="space-y-1"><Label>تاريخ الاستحقاق</Label><DateSmartInput type="date" value={form.due_date} onChange={v => setForm(f => ({ ...f, due_date: v }))} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>القضية</Label>
              <ChoiceInput value={form.case_title} onChange={handleCaseSelect} options={cases.map(c => c.title)} listId="invoice-cases" helper="يمكنك البدء بالكتابة أو اختيار قضية موجودة" />
            </div>
            <div className="space-y-1"><Label>اسم الموكل *</Label>
              <ChoiceInput value={form.client_name} onChange={v => setForm(f => ({ ...f, client_name: v }))} options={clients.map(cl => cl.full_name)} listId="clients-invoice-list" helper="يمكنك الكتابة إذا لم يكن الاسم موجوداً في القائمة" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1"><Label>اسم المكتب</Label><Input value={form.office_name} onChange={e => setForm(f => ({ ...f, office_name: e.target.value }))} className="h-11" /></div>
            <div className="space-y-1"><Label>هاتف المكتب</Label><Input value={form.office_phone} onChange={e => setForm(f => ({ ...f, office_phone: e.target.value }))} className="h-11" /></div>
            <div className="space-y-1"><Label>عنوان المكتب</Label><Input value={form.office_address} onChange={e => setForm(f => ({ ...f, office_address: e.target.value }))} className="h-11" /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>بنود الفاتورة</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1 text-xs"><Plus className="h-3 w-3" /> إضافة بند</Button>
            </div>
            {form.items.length > 0 ? (
              <div className="space-y-2">
                {form.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input placeholder="وصف البند" value={item.description} onChange={e => updateItem(index, "description", e.target.value)} className="flex-1 h-11" />
                    <Input type="number" placeholder="المبلغ" value={item.amount} onChange={e => updateItem(index, "amount", e.target.value)} className="w-36 h-11" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-destructive h-11 w-11"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <div className="text-left text-sm font-medium text-primary mt-1">المجموع: {itemsTotal.toLocaleString()} د.إ</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>إجمالي الأتعاب (درهم) *</Label><Input type="number" value={form.total_fees} onChange={e => setForm(f => ({ ...f, total_fees: e.target.value }))} className="h-11" /></div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1"><Label>المبلغ المدفوع (درهم)</Label><Input type="number" value={form.paid_amount} onChange={e => setForm(f => ({ ...f, paid_amount: e.target.value }))} className="h-11" /></div>
            <div className="space-y-1"><Label>الخصم (درهم)</Label><Input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} className="h-11" /></div>
            <div className="space-y-1"><Label>ضريبة القيمة المضافة (%)</Label><Input type="number" value={form.vat_rate} onChange={e => setForm(f => ({ ...f, vat_rate: e.target.value }))} className="h-11" /></div>
          </div>

          <div className="space-y-1">
            <Label>طريقة الدفع</Label>
            <ChoiceInput value={form.payment_method} onChange={v => setForm(f => ({ ...f, payment_method: v }))} options={PAYMENT_METHODS} listId="invoice-payment-methods" />
          </div>

          <div className="space-y-1">
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="min-h-[100px]" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving || !form.client_name || !form.issue_date} className="bg-primary text-white">
            {saving ? "جارٍ الحفظ..." : invoice ? "حفظ التعديلات" : "إنشاء الفاتورة"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

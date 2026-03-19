import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Search, Wallet, TrendingDown, Calendar, Edit, Trash2, Receipt,
  ChevronDown, Filter, Tag
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import PageHeader from "../components/helm/PageHeader";
import EmptyState from "../components/helm/EmptyState";

const CATEGORIES = ["رسوم قضائية", "مواصلات", "طباعة ومستلزمات", "رسوم تسجيل", "أتعاب خبراء", "إيجار", "رواتب", "اتصالات", "أخرى"];

const CATEGORY_COLORS = {
  "رسوم قضائية": "bg-red-100 text-red-700 border-red-200",
  "مواصلات": "bg-blue-100 text-blue-700 border-blue-200",
  "طباعة ومستلزمات": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "رسوم تسجيل": "bg-purple-100 text-purple-700 border-purple-200",
  "أتعاب خبراء": "bg-orange-100 text-orange-700 border-orange-200",
  "إيجار": "bg-teal-100 text-teal-700 border-teal-200",
  "رواتب": "bg-green-100 text-green-700 border-green-200",
  "اتصالات": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "أخرى": "bg-gray-100 text-gray-700 border-gray-200",
};

const CATEGORY_ICONS = {
  "رسوم قضائية": "⚖️",
  "مواصلات": "🚗",
  "طباعة ومستلزمات": "🖨️",
  "رسوم تسجيل": "📋",
  "أتعاب خبراء": "👨‍💼",
  "إيجار": "🏢",
  "رواتب": "💼",
  "اتصالات": "📞",
  "أخرى": "📌",
};

const emptyForm = {
  title: "", amount: "", category: "أخرى",
  expense_date: format(new Date(), "yyyy-MM-dd"),
  case_title: "", client_name: "", payment_method: "نقداً",
  notes: "", is_billable: false, status: "مدفوع"
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    setLoading(true);
    const data = await base44.entities.Expense.list("-expense_date");
    setExpenses(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, amount: parseFloat(form.amount) || 0 };
    if (editing) {
      await base44.entities.Expense.update(editing.id, payload);
    } else {
      await base44.entities.Expense.create(payload);
    }
    setSaving(false);
    setShowForm(false);
    await loadExpenses();
  };

  const handleEdit = (e) => { setEditing(e); setForm({ ...emptyForm, ...e }); setShowForm(true); };
  const handleCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const handleDelete = async (id) => {
    if (!confirm("حذف هذا المصروف؟")) return;
    await base44.entities.Expense.delete(id);
    await loadExpenses();
  };

  const filtered = expenses.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !search || e.title?.toLowerCase().includes(q) || e.client_name?.toLowerCase().includes(q) || e.case_title?.toLowerCase().includes(q);
    const matchCat = categoryFilter === "الكل" || e.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const now = new Date();
  const totalAll = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalMonth = expenses
    .filter(e => e.expense_date && isWithinInterval(new Date(e.expense_date), { start: startOfMonth(now), end: endOfMonth(now) }))
    .reduce((s, e) => s + (e.amount || 0), 0);
  const totalBillable = expenses.filter(e => e.is_billable).reduce((s, e) => s + (e.amount || 0), 0);
  const totalPending = expenses.filter(e => e.status === "معلق").reduce((s, e) => s + (e.amount || 0), 0);

  // Category breakdown
  const categoryTotals = CATEGORIES.map(cat => ({
    name: cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0),
    count: expenses.filter(e => e.category === cat).length,
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div>
      <PageHeader
        title="المصاريف"
        subtitle={`${expenses.length} مصروف · إجمالي ${totalAll.toLocaleString()} د.إ`}
        action={
          <Button onClick={handleCreate} className="bg-primary text-white gap-2">
            <Plus className="h-4 w-4" /> إضافة مصروف
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إجمالي المصاريف</p>
              <p className="text-lg font-bold text-foreground">{totalAll.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">د.إ</span></p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">هذا الشهر</p>
              <p className="text-lg font-bold text-blue-600">{totalMonth.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">د.إ</span></p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <Receipt className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">قابلة للفوترة</p>
              <p className="text-lg font-bold text-green-600">{totalBillable.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">د.إ</span></p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">معلقة</p>
              <p className="text-lg font-bold text-yellow-600">{totalPending.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">د.إ</span></p>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      {categoryTotals.length > 0 && (
        <Card className="p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> توزيع المصاريف حسب الفئة
          </h3>
          <div className="flex flex-wrap gap-2">
            {categoryTotals.map(c => (
              <button
                key={c.name}
                onClick={() => setCategoryFilter(categoryFilter === c.name ? "الكل" : c.name)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${categoryFilter === c.name ? "bg-primary text-white border-primary" : "bg-background border-border hover:border-primary/50"}`}
              >
                <span>{CATEGORY_ICONS[c.name] || "📌"}</span>
                <span>{c.name}</span>
                <span className={`font-bold ${categoryFilter === c.name ? "text-white/80" : "text-primary"}`}>{c.total.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في المصاريف..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        {categoryFilter !== "الكل" && (
          <Button variant="outline" onClick={() => setCategoryFilter("الكل")} className="gap-2 text-xs">
            <Filter className="h-3 w-3" /> {categoryFilter} × إلغاء
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="لا توجد مصاريف"
          description="ابدأ بتسجيل مصاريف المكتب والقضايا"
          action={<Button onClick={handleCreate}>إضافة مصروف</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(expense => (
            <Card key={expense.id} className="p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0 text-xl">
                    {CATEGORY_ICONS[expense.category] || "📌"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground leading-tight">{expense.title}</h3>
                    {expense.case_title && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        ⚖️ {expense.case_title}
                      </p>
                    )}
                    {expense.client_name && (
                      <p className="text-xs text-muted-foreground">👤 {expense.client_name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        📅 {expense.expense_date ? format(new Date(expense.expense_date), "yyyy/MM/dd") : ""}
                      </span>
                      {expense.payment_method && (
                        <span className="text-xs text-muted-foreground">· {expense.payment_method}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-left shrink-0 space-y-1">
                  <p className="text-xl font-bold text-red-600">{(expense.amount || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground text-left">د.إ</p>
                  <Badge className={`text-xs border ${expense.status === "مدفوع" ? "bg-green-100 text-green-700 border-green-200" : expense.status === "معلق" ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {expense.status}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Badge className={`text-xs border ${CATEGORY_COLORS[expense.category] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                  {expense.category}
                </Badge>
                {expense.is_billable && (
                  <Badge className="text-xs bg-primary/10 text-primary border border-primary/20">💰 قابل للفوترة</Badge>
                )}
              </div>

              {expense.notes && (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 mb-3 leading-relaxed">{expense.notes}</p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => handleEdit(expense)} className="gap-1 text-xs flex-1">
                  <Edit className="h-3 w-3" /> تعديل
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              {editing ? "تعديل المصروف" : "إضافة مصروف جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>وصف المصروف *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="مثال: رسوم تقديم دعوى في محكمة دبي" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>المبلغ (د.إ) *</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ المصروف *</Label>
                <Input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>التصنيف</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_ICONS[c]} {c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>طريقة الدفع</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["نقداً", "تحويل بنكي", "شيك", "بطاقة ائتمان"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>القضية (اختياري)</Label>
                <Input value={form.case_title} onChange={e => setForm(f => ({ ...f, case_title: e.target.value }))} placeholder="عنوان القضية" />
              </div>
              <div className="space-y-1.5">
                <Label>الموكل (اختياري)</Label>
                <Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="اسم الموكل" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["مدفوع", "معلق", "ملغى"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 pt-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="billable"
                    checked={form.is_billable}
                    onChange={e => setForm(f => ({ ...f, is_billable: e.target.checked }))}
                    className="h-4 w-4 accent-primary"
                  />
                  <label htmlFor="billable" className="text-sm text-foreground cursor-pointer">قابل للفوترة للموكل</label>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="أي ملاحظات إضافية..."
                className="h-20"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title || !form.amount}
              className="bg-primary text-white"
            >
              {saving ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "إضافة المصروف"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
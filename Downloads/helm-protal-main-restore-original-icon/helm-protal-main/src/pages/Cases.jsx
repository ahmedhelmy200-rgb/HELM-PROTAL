import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Briefcase, Calendar } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";
import { useAuth } from "@/lib/AuthContext";

const CASE_TYPES = ["مدني", "جزائي", "تجاري", "عمالي", "أسري", "إداري", "عقاري", "أخرى"];
const STATUSES = ["جارية", "متوقفة", "مكتملة", "مغلقة"];
const PRIORITIES = ["عالية", "متوسطة", "منخفضة"];

const emptyForm = {
  case_number: "", title: "", client_name: "", case_type: "مدني",
  court: "", judge: "", status: "جارية", priority: "متوسطة",
  next_session_date: "", filing_date: "", description: "", fees: "",
  paid_amount: "", assigned_lawyer: "", opponent_name: "", opponent_lawyer: ""
};

export default function Cases() {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [c, cl] = await Promise.all([
      base44.entities.Case.list("-created_date"),
      base44.entities.Client.list()
    ]);
    setCases(c);
    setClients(cl);
    setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...emptyForm, ...c, fees: c.fees || "", paid_amount: c.paid_amount || "", next_session_date: c.next_session_date ? c.next_session_date.slice(0,16) : "", filing_date: c.filing_date || "" }); setShowDialog(true); };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, fees: form.fees ? Number(form.fees) : undefined, paid_amount: form.paid_amount ? Number(form.paid_amount) : 0 };
    if (editing) await base44.entities.Case.update(editing.id, data);
    else await base44.entities.Case.create(data);
    setShowDialog(false);
    await loadData();
    setSaving(false);
  };

  const filtered = cases.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.title?.toLowerCase().includes(q) || c.client_name?.toLowerCase().includes(q) || c.case_number?.includes(q);
    const matchStatus = statusFilter === "الكل" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <PageHeader
        title="القضايا"
        subtitle={`${cases.length} قضية`}
        action={!isClient ? <Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" />إضافة قضية</Button> : undefined}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو رقم القضية..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل">كل الحالات</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="لا توجد قضايا" description="ابدأ بإضافة قضيتك الأولى" action={!isClient ? <Button onClick={openCreate}>إضافة قضية</Button> : undefined} />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(c => (
            <Card key={c.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => !isClient && openEdit(c)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{c.title}</h3>
                    {c.case_number && <span className="text-xs text-muted-foreground">#{c.case_number}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{c.client_name} · {c.case_type}</p>
                  {c.court && <p className="text-xs text-muted-foreground mt-0.5">{c.court}</p>}
                  {c.next_session_date && (
                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      الجلسة القادمة: {format(new Date(c.next_session_date), "yyyy/MM/dd")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={c.status} />
                  <StatusBadge status={c.priority} isPriority />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isClient && <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل القضية" : "إضافة قضية جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 col-span-2"><Label>عنوان القضية *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="space-y-1"><Label>رقم القضية</Label><Input value={form.case_number} onChange={e => setForm({...form, case_number: e.target.value})} /></div>
            <div className="space-y-1"><Label>اسم الموكل *</Label>
              <Input list="clients-list" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} />
              <datalist id="clients-list">{clients.map(cl => <option key={cl.id} value={cl.full_name} />)}</datalist>
            </div>
            <div className="space-y-1"><Label>نوع القضية</Label>
              <Select value={form.case_type} onValueChange={v => setForm({...form, case_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CASE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>الأولوية</Label>
              <Select value={form.priority} onValueChange={v => setForm({...form, priority: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>المحكمة</Label><Input value={form.court} onChange={e => setForm({...form, court: e.target.value})} /></div>
            <div className="space-y-1"><Label>القاضي</Label><Input value={form.judge} onChange={e => setForm({...form, judge: e.target.value})} /></div>
            <div className="space-y-1"><Label>الخصم</Label><Input value={form.opponent_name} onChange={e => setForm({...form, opponent_name: e.target.value})} /></div>
            <div className="space-y-1"><Label>محامي الخصم</Label><Input value={form.opponent_lawyer} onChange={e => setForm({...form, opponent_lawyer: e.target.value})} /></div>
            <div className="space-y-1"><Label>تاريخ الجلسة القادمة</Label><Input type="datetime-local" value={form.next_session_date} onChange={e => setForm({...form, next_session_date: e.target.value})} /></div>
            <div className="space-y-1"><Label>تاريخ الرفع</Label><Input type="date" value={form.filing_date} onChange={e => setForm({...form, filing_date: e.target.value})} /></div>
            <div className="space-y-1"><Label>الأتعاب (درهم)</Label><Input type="number" value={form.fees} onChange={e => setForm({...form, fees: e.target.value})} /></div>
            <div className="space-y-1"><Label>المدفوع (درهم)</Label><Input type="number" value={form.paid_amount} onChange={e => setForm({...form, paid_amount: e.target.value})} /></div>
            <div className="space-y-1 col-span-2"><Label>وصف القضية</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="h-20" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.client_name} className="bg-primary text-white">
              {saving ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "إضافة القضية"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>}
    </div>
  );
}
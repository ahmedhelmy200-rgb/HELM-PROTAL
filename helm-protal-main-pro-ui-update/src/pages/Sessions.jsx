import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, CalendarDays, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";
import ChoiceInput from "@/components/shared/ChoiceInput";
import DateSmartInput from "@/components/shared/DateSmartInput";

const SESSION_TYPES = ["مرافعة", "إثبات", "حكم", "تأجيل", "صلح", "أخرى"];
const STATUSES = ["قادمة", "منعقدة", "مؤجلة", "ملغية"];

const emptyForm = { case_id: "", case_title: "", case_number: "", client_name: "", session_date: "", court: "", hall: "", session_type: "مرافعة", status: "قادمة", result: "", next_session_date: "", notes: "" };

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [cases, setCases] = useState([]);
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
    const [sessionRows, caseRows] = await Promise.all([base44.entities.Session.list("-session_date"), base44.entities.Case.list()]);
    setSessions(sessionRows); setCases(caseRows); setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (session) => { setEditing(session); setForm({ ...emptyForm, ...session, session_date: session.session_date?.slice(0,16) || "", next_session_date: session.next_session_date?.slice(0,16) || "" }); setShowDialog(true); };

  const handleCaseSelect = (caseTitle) => {
    const selected = cases.find(c => c.title === caseTitle);
    if (selected) setForm(f => ({ ...f, case_id: selected.id, case_title: selected.title, case_number: selected.case_number || "", client_name: selected.client_name, court: selected.court || f.court }));
    else setForm(f => ({ ...f, case_title: caseTitle }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await base44.entities.Session.update(editing.id, form);
      else await base44.entities.Session.create(form);
      setShowDialog(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const filtered = sessions.filter(session => {
    const q = search.toLowerCase();
    const matchSearch = !search || session.case_title?.toLowerCase().includes(q) || session.client_name?.toLowerCase().includes(q) || session.court?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "الكل" || session.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <PageHeader title="الجلسات" subtitle={`${sessions.length} جلسة`} action={<Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" />إضافة جلسة</Button>} />
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-11" />
        </div>
        <ChoiceInput value={statusFilter} onChange={setStatusFilter} options={["الكل", ...STATUSES]} listId="sessions-status-filter" helper="" className="sm:w-40 h-11" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} title="لا توجد جلسات" description="أضف جلستك الأولى" action={<Button onClick={openCreate}>إضافة جلسة</Button>} />
      ) : (
        <div className="space-y-3">
          {filtered.map(session => (
            <Card key={session.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(session)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-lg leading-none">{format(new Date(session.session_date), "dd")}</span>
                    <span className="text-primary text-[10px]">{format(new Date(session.session_date), "MMM")}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{session.case_title}</h3>
                    <p className="text-sm text-muted-foreground">{session.client_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{session.court}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(session.session_date), "HH:mm")}</span>
                      {session.hall && <span>قاعة {session.hall}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 items-end shrink-0">
                  <StatusBadge status={session.status} />
                  <span className="text-xs text-muted-foreground">{session.session_type}</span>
                </div>
              </div>
              {session.result && <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">النتيجة: {session.result}</p>}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "تعديل الجلسة" : "إضافة جلسة جديدة"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 md:col-span-2"><Label>القضية *</Label><ChoiceInput value={form.case_title} onChange={handleCaseSelect} options={cases.map(c => c.title)} listId="cases-list" /></div>
            <div className="space-y-1"><Label>تاريخ الجلسة *</Label><DateSmartInput type="datetime-local" value={form.session_date} onChange={v => setForm({...form, session_date: v})} /></div>
            <div className="space-y-1"><Label>نوع الجلسة</Label><ChoiceInput value={form.session_type} onChange={v => setForm({...form, session_type: v})} options={SESSION_TYPES} listId="session-types" /></div>
            <div className="space-y-1"><Label>المحكمة *</Label><Input value={form.court} onChange={e => setForm({...form, court: e.target.value})} className="h-11" /></div>
            <div className="space-y-1"><Label>القاعة</Label><Input value={form.hall} onChange={e => setForm({...form, hall: e.target.value})} className="h-11" /></div>
            <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={v => setForm({...form, status: v})} options={STATUSES} listId="session-statuses" /></div>
            <div className="space-y-1"><Label>الجلسة التالية</Label><DateSmartInput type="datetime-local" value={form.next_session_date} onChange={v => setForm({...form, next_session_date: v})} /></div>
            <div className="space-y-1 md:col-span-2"><Label>نتيجة الجلسة</Label><Input value={form.result} onChange={e => setForm({...form, result: e.target.value})} className="h-11" /></div>
            <div className="space-y-1 md:col-span-2"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="min-h-[100px]" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || !form.session_date || !form.court} className="bg-primary text-white">
              {saving ? "جارٍ الحفظ..." : editing ? "حفظ" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Briefcase, Calendar, ArrowUpDown } from "lucide-react";
import { format, isValid } from "date-fns";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import ChoiceInput from "@/components/shared/ChoiceInput";
import DateSmartInput from "@/components/shared/DateSmartInput";
import { PageErrorState } from "@/components/app/AppStatusBar";
import PaginationControls from "@/components/shared/PaginationControls";
import { searchInFields } from "@/lib/search";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { APP_SHORTCUT_NEW, APP_SHORTCUT_SEARCH, subscribeAppEvent } from "@/lib/app-events";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CASE_TYPES = ["مدني", "جزائي", "تجاري", "عمالي", "أسري", "إداري", "عقاري", "أخرى"];
const STATUSES = ["جارية", "متوقفة", "مكتملة", "مغلقة"];
const PRIORITIES = ["عالية", "متوسطة", "منخفضة"];
const SORT_OPTIONS = {
  'الأحدث': '-created_date',
  'العنوان': 'title',
  'رقم القضية': 'case_number',
  'أقرب جلسة': 'next_session_date',
};

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
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [sortBy, setSortBy] = useState("-created_date");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formTab, setFormTab] = useState('core');
  const searchRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [{ data: caseRows, total: totalRows }, clientRows] = await Promise.all([
        base44.entities.Case.listPage(sortBy, { page, pageSize }),
        base44.entities.Client.list(),
      ]);
      setCases(caseRows);
      setClients(clientRows);
      setTotal(totalRows);
    } catch (error) {
      setLoadError(error.message || "تعذر تحميل القضايا.");
    } finally {
      setLoading(false);
    }
  }, [page, sortBy]);

  useEffect(() => { loadData(); }, [loadData]);
  usePageRefresh(loadData, ['cases', 'clients']);

  useEffect(() => {
    const offNew = subscribeAppEvent(APP_SHORTCUT_NEW, ({ page: p }) => {
      if (!isClient && p === 'Cases') openCreate();
    });
    const offSearch = subscribeAppEvent(APP_SHORTCUT_SEARCH, ({ page: p }) => {
      if (p === 'Cases') searchRef.current?.focus();
    });
    return () => { offNew(); offSearch(); };
  }, [isClient]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormTab('core'); setShowDialog(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      ...emptyForm,
      ...item,
      fees: item.fees || "",
      paid_amount: item.paid_amount || "",
      next_session_date: item.next_session_date?.slice(0, 16) || "",
      filing_date: item.filing_date || "",
    });
    setFormTab('core');
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, fees: form.fees ? Number(form.fees) : undefined, paid_amount: form.paid_amount ? Number(form.paid_amount) : 0 };
      if (editing) await base44.entities.Case.update(editing.id, payload);
      else await base44.entities.Case.create(payload);
      setShowDialog(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const filtered = cases.filter(item => {
    const matchSearch = searchInFields(item, ['title', 'client_name', 'case_number', 'court', 'assigned_lawyer', 'opponent_name'], search);
    const matchStatus = statusFilter === "الكل" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="القضايا"
        subtitle={`${total || cases.length} قضية`}
        action={!isClient ? <Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" />إضافة قضية</Button> : undefined}
      />

      <div className="flex flex-col xl:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input ref={searchRef} placeholder="بحث ذكي بالاسم أو رقم القضية أو المحكمة..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-11" />
        </div>
        <ChoiceInput value={statusFilter} onChange={setStatusFilter} options={["الكل", ...STATUSES]} listId="cases-status-filter" helper="" className="xl:w-44 h-11" />
        <ChoiceInput value={Object.keys(SORT_OPTIONS).find((label) => SORT_OPTIONS[label] === sortBy) || 'الأحدث'} onChange={(label) => { setSortBy(SORT_OPTIONS[label] || '-created_date'); setPage(1); }} options={Object.keys(SORT_OPTIONS)} listId="cases-sort" helper="" className="xl:w-44 h-11" />
      </div>

      <Card className="p-3 border-primary/10 bg-primary/5 text-sm text-muted-foreground flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-primary" />
        البحث الآن يطبع العربية ويزيل التشكيل، والصفحة تستخدم ترحيلًا بدل تحميل كل السجلات دفعة واحدة.
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : loadError ? (
        <PageErrorState message={loadError} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="لا توجد قضايا" description="ابدأ بإضافة قضيتك الأولى" action={!isClient ? <Button onClick={openCreate}>إضافة قضية</Button> : undefined} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3">
            {filtered.map(item => (
              <Card key={item.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => !isClient && openEdit(item)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      {item.case_number && <span className="text-xs text-muted-foreground">#{item.case_number}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.client_name} · {item.case_type}</p>
                    {item.court && <p className="text-xs text-muted-foreground mt-0.5">{item.court}</p>}
                    {item.next_session_date && (
                      <p className="text-xs text-primary mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        الجلسة القادمة: {item.next_session_date && isValid(new Date(item.next_session_date)) ? format(new Date(item.next_session_date), "yyyy/MM/dd") : "—"}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={item.status} />
                    <StatusBadge status={item.priority} isPriority />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <PaginationControls page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      {!isClient && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editing ? "تعديل القضية" : "إضافة قضية جديدة"}</DialogTitle>
            </DialogHeader>
            <Tabs value={formTab} onValueChange={setFormTab} className="mt-2">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="core">البيانات الأساسية</TabsTrigger>
                <TabsTrigger value="timeline">التواريخ والجلسات</TabsTrigger>
                <TabsTrigger value="finance">الخصوم والأتعاب</TabsTrigger>
              </TabsList>
              <TabsContent value="core" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1 md:col-span-2"><Label>عنوان القضية *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="h-11" /></div>
                  <div className="space-y-1"><Label>رقم القضية</Label><Input value={form.case_number} onChange={e => setForm({...form, case_number: e.target.value})} className="h-11" /></div>
                  <div className="space-y-1"><Label>اسم الموكل *</Label><ChoiceInput value={form.client_name} onChange={v => setForm({...form, client_name: v})} options={clients.map(cl => cl.full_name)} listId="clients-list" /></div>
                  <div className="space-y-1"><Label>نوع القضية</Label><ChoiceInput value={form.case_type} onChange={v => setForm({...form, case_type: v})} options={CASE_TYPES} listId="case-types" /></div>
                  <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={v => setForm({...form, status: v})} options={STATUSES} listId="case-statuses" /></div>
                  <div className="space-y-1"><Label>الأولوية</Label><ChoiceInput value={form.priority} onChange={v => setForm({...form, priority: v})} options={PRIORITIES} listId="case-priority" /></div>
                  <div className="space-y-1"><Label>المحكمة</Label><Input value={form.court} onChange={e => setForm({...form, court: e.target.value})} className="h-11" /></div>
                  <div className="space-y-1"><Label>القاضي</Label><Input value={form.judge} onChange={e => setForm({...form, judge: e.target.value})} className="h-11" /></div>
                </div>
              </TabsContent>
              <TabsContent value="timeline" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1"><Label>تاريخ الجلسة القادمة</Label><DateSmartInput type="datetime-local" value={form.next_session_date} onChange={v => setForm({...form, next_session_date: v})} /></div>
                  <div className="space-y-1"><Label>تاريخ الرفع</Label><DateSmartInput type="date" value={form.filing_date} onChange={v => setForm({...form, filing_date: v})} /></div>
                  <div className="space-y-1 md:col-span-2"><Label>وصف القضية</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="min-h-[120px]" /></div>
                </div>
              </TabsContent>
              <TabsContent value="finance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1"><Label>الخصم</Label><Input value={form.opponent_name} onChange={e => setForm({...form, opponent_name: e.target.value})} className="h-11" /></div>
                  <div className="space-y-1"><Label>محامي الخصم</Label><Input value={form.opponent_lawyer} onChange={e => setForm({...form, opponent_lawyer: e.target.value})} className="h-11" /></div>
                  <div className="space-y-1"><Label>المحامي المكلف</Label><Input value={form.assigned_lawyer} onChange={e => setForm({...form, assigned_lawyer: e.target.value})} className="h-11" /></div>
                  <div className="space-y-1"><Label>الأتعاب (درهم)</Label><Input type="number" value={form.fees} onChange={e => setForm({...form, fees: e.target.value})} className="h-11" /></div>
                  <div className="space-y-1"><Label>المدفوع (درهم)</Label><Input type="number" value={form.paid_amount} onChange={e => setForm({...form, paid_amount: e.target.value})} className="h-11" /></div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
              <Button onClick={handleSave} disabled={saving || !form.title || !form.client_name} className="bg-primary text-white">
                {saving ? "جارٍ الحفظ..." : editing ? "حفظ" : "إضافة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

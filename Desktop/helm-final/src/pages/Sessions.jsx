import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, CalendarDays, MapPin, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";
import ChoiceInput from "@/components/shared/ChoiceInput";
import DateSmartInput from "@/components/shared/DateSmartInput";
import { PageErrorState } from "@/components/app/AppStatusBar";
import { searchInFields } from "@/lib/search";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { APP_SHORTCUT_NEW, APP_SHORTCUT_SEARCH, subscribeAppEvent } from "@/lib/app-events";

const SESSION_TYPES = ["مرافعة", "إثبات", "حكم", "تأجيل", "صلح", "أخرى"];
const STATUSES = ["قادمة", "منعقدة", "مؤجلة", "ملغية"];
const emptyForm = { case_id: "", case_title: "", case_number: "", client_name: "", session_date: "", court: "", hall: "", session_type: "مرافعة", status: "قادمة", result: "", next_session_date: "", notes: "" };

function dayLabel(date) {
  return format(date, 'dd/MM');
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [cases, setCases] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('month');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const searchRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [sessionRows, caseRows, taskRows, eventRows] = await Promise.all([
        base44.entities.Session.list("-session_date", 300),
        base44.entities.Case.list('title', 300),
        base44.entities.Task.list("-due_date", 300),
        base44.entities.Event.list("-date", 300),
      ]);
      setSessions(sessionRows);
      setCases(caseRows);
      setTasks(taskRows);
      setEvents(eventRows);
    } catch (error) {
      setLoadError(error.message || 'تعذر تحميل الجلسات والتقويم.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  usePageRefresh(loadData, ['sessions', 'cases', 'tasks', 'events']);

  useEffect(() => {
    const offNew = subscribeAppEvent(APP_SHORTCUT_NEW, ({ page }) => page === 'Sessions' && openCreate());
    const offSearch = subscribeAppEvent(APP_SHORTCUT_SEARCH, ({ page }) => page === 'Sessions' && searchRef.current?.focus());
    return () => { offNew(); offSearch(); };
  }, []);

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
    const matchSearch = searchInFields(session, ['case_title', 'client_name', 'court', 'hall', 'result'], search);
    const matchStatus = statusFilter === "الكل" || session.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const calendarItems = useMemo(() => {
    const sessionItems = filtered.map((item) => ({ ...item, source: 'جلسة', date: item.session_date, label: item.case_title, status: item.status }));
    const taskItems = tasks.filter((task) => task.due_date).map((item) => ({ ...item, source: 'مهمة', date: item.due_date, label: item.title, status: item.status }));
    const eventItems = events.filter((event) => event.date).map((item) => ({ ...item, source: 'موعد', date: item.date, label: item.title, status: item.event_type || 'موعد' }));
    return [...sessionItems, ...taskItems, ...eventItems].filter((item) => item.date).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filtered, tasks, events]);

  const monthDays = useMemo(() => eachDayOfInterval({ start: startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 6 }), end: endOfWeek(endOfMonth(anchorDate), { weekStartsOn: 6 }) }), [anchorDate]);
  const weekDays = useMemo(() => eachDayOfInterval({ start: startOfWeek(anchorDate, { weekStartsOn: 6 }), end: endOfWeek(anchorDate, { weekStartsOn: 6 }) }), [anchorDate]);

  const getItemsForDay = (day) => calendarItems.filter((item) => isSameDay(new Date(item.date), day));

  return (
    <div className="space-y-5">
      <PageHeader title="الجلسات والتقويم" subtitle={`${sessions.length} جلسة + ${tasks.length} مهمة + ${events.length} موعد`} action={<Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" />إضافة جلسة</Button>} />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_auto] gap-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input ref={searchRef} placeholder="بحث في الجلسات أو المحكمة أو الموكل..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-11" />
        </div>
        <ChoiceInput value={statusFilter} onChange={setStatusFilter} options={["الكل", ...STATUSES]} listId="sessions-status-filter" helper="" className="xl:w-40 h-11" />
        <ChoiceInput value={viewMode === 'month' ? 'شهري' : viewMode === 'week' ? 'أسبوعي' : 'قائمة'} onChange={(v) => setViewMode(v === 'شهري' ? 'month' : v === 'أسبوعي' ? 'week' : 'list')} options={["شهري", "أسبوعي", "قائمة"]} listId="calendar-view-mode" helper="" className="xl:w-36 h-11" />
      </div>

      <Card className="p-4 border-primary/10 bg-primary/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="font-semibold">تقويم مهني موحد</p>
            <p className="text-sm text-muted-foreground">يعرض الجلسات والمواعيد والمهام معًا. التنقل شهري أو أسبوعي أو قائمة.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setAnchorDate(viewMode === 'week' ? subWeeks(anchorDate, 1) : subMonths(anchorDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
            <div className="min-w-[140px] text-center font-semibold">{format(anchorDate, viewMode === 'week' ? 'yyyy/MM/dd' : 'MMMM yyyy')}</div>
            <Button variant="outline" size="icon" onClick={() => setAnchorDate(viewMode === 'week' ? addWeeks(anchorDate, 1) : addMonths(anchorDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : loadError ? (
        <PageErrorState message={loadError} onRetry={loadData} />
      ) : filtered.length === 0 && viewMode === 'list' ? (
        <EmptyState icon={CalendarDays} title="لا توجد جلسات" description="أضف جلستك الأولى" action={<Button onClick={openCreate}>إضافة جلسة</Button>} />
      ) : viewMode === 'list' ? (
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
                <div className="flex flex-col gap-1.5 items-end shrink-0"><StatusBadge status={session.status} /><span className="text-xs text-muted-foreground">{session.session_type}</span></div>
              </div>
            </Card>
          ))}
        </div>
      ) : viewMode === 'month' ? (
        <div className="grid grid-cols-7 gap-3">
          {monthDays.map((day) => {
            const items = getItemsForDay(day);
            return (
              <Card key={day.toISOString()} className={`p-3 min-h-[140px] ${isSameMonth(day, anchorDate) ? '' : 'opacity-45'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{dayLabel(day)}</span>
                  {items.length > 0 && <Badge variant="secondary">{items.length}</Badge>}
                </div>
                <div className="space-y-2">
                  {items.slice(0, 3).map((item, index) => (
                    <button key={`${item.source}-${item.id || index}`} onClick={() => item.source === 'جلسة' && openEdit(item)} className="w-full text-right rounded-xl border border-border bg-muted/40 px-2 py-1.5 text-xs">
                      <div className="font-semibold truncate">{item.label}</div>
                      <div className="text-muted-foreground truncate">{item.source} · {format(new Date(item.date), 'HH:mm')}</div>
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {weekDays.map((day) => {
            const items = getItemsForDay(day);
            return (
              <Card key={day.toISOString()} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold">{format(day, 'EEEE')}</p>
                    <p className="text-xs text-muted-foreground">{dayLabel(day)}</p>
                  </div>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? <p className="text-sm text-muted-foreground">لا يوجد شيء مجدول.</p> : items.map((item, index) => (
                    <div key={`${item.source}-${item.id || index}`} className="rounded-2xl border border-border bg-muted/40 p-3 text-sm">
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{item.source} · {format(new Date(item.date), 'HH:mm')}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
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
          <div className="flex justify-end gap-3 mt-4"><Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button><Button onClick={handleSave} disabled={saving || !form.session_date || !form.court} className="bg-primary text-white">{saving ? "جارٍ الحفظ..." : editing ? "حفظ" : "إضافة"}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

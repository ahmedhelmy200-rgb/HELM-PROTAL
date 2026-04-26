import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, CalendarDays, MapPin, Clock, ChevronRight, ChevronLeft, Trash2 } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, isValid,
} from "date-fns";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";
import ChoiceInput from "@/components/shared/ChoiceInput";
import DateSmartInput from "@/components/shared/DateSmartInput";
import { buildGoogleCalendarUrl } from "@/lib/googleCalendar";
import ActionButtons from "@/components/shared/ActionButtons";
import { PageErrorState } from "@/components/app/AppStatusBar";
import { searchInFields } from "@/lib/search";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { APP_SHORTCUT_NEW, APP_SHORTCUT_SEARCH, subscribeAppEvent } from "@/lib/app-events";

const SESSION_TYPES = ["مرافعة", "إثبات", "حكم", "تأجيل", "صلح", "أخرى"];
const STATUSES      = ["قادمة", "منعقدة", "مؤجلة", "ملغية"];
const emptyForm     = {
  case_id: "", case_title: "", case_number: "", client_name: "",
  session_date: "", court: "", hall: "", session_type: "مرافعة",
  status: "قادمة", result: "", next_session_date: "", notes: "",
};

// ── حماية من التواريخ الفاسدة ────────────────────────────────────────────────
function safeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isValid(d) ? d : null;
}
function safeFmt(value, pattern, fallback = "—") {
  const d = safeDate(value);
  try { return d ? format(d, pattern) : fallback; } catch { return fallback; }
}

export default function Sessions() {
  const [sessions,   setSessions  ] = useState([]);
  const [cases,      setCases     ] = useState([]);
  const [tasks,      setTasks     ] = useState([]);
  const [events,     setEvents    ] = useState([]);
  const [loading,    setLoading   ] = useState(true);
  const [loadError,  setLoadError ] = useState("");
  const [search,     setSearch    ] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [showDialog, setShowDialog] = useState(false);
  const [editing,    setEditing   ] = useState(null);
  const [form,       setForm      ] = useState(emptyForm);
  const [saving,     setSaving    ] = useState(false);
  const [deleting,   setDeleting  ] = useState(false);
  const [viewMode,   setViewMode  ] = useState("month");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const searchRef = useRef(null);

  // ── data loading ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [sessionRows, caseRows, taskRows, eventRows] = await Promise.all([
        base44.entities.Session.list("-session_date", 500),
        base44.entities.Case.list("title", 300),
        base44.entities.Task.list("-due_date", 300),
        base44.entities.Event.list("-date", 300),
      ]);
      setSessions(sessionRows);
      setCases(caseRows);
      setTasks(taskRows);
      setEvents(eventRows);
    } catch (err) {
      setLoadError(err.message || "تعذر تحميل الجلسات.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  usePageRefresh(loadData, ["sessions", "cases", "tasks", "events"]);

  useEffect(() => {
    const offNew    = subscribeAppEvent(APP_SHORTCUT_NEW,    ({ page: p }) => p === "Sessions" && openCreate());
    const offSearch = subscribeAppEvent(APP_SHORTCUT_SEARCH, ({ page: p }) => p === "Sessions" && searchRef.current?.focus());
    return () => { offNew(); offSearch(); };
  }, []);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit   = (s)  => {
    setEditing(s);
    setForm({
      ...emptyForm, ...s,
      session_date:      s.session_date?.slice(0, 16)      || "",
      next_session_date: s.next_session_date?.slice(0, 16) || "",
    });
    setShowDialog(true);
  };

  const handleCaseSelect = (caseTitle) => {
    const sel = cases.find(c => c.title === caseTitle);
    if (sel) setForm(f => ({ ...f, case_id: sel.id, case_title: sel.title, case_number: sel.case_number || "", client_name: sel.client_name, court: sel.court || f.court }));
    else     setForm(f => ({ ...f, case_title: caseTitle }));
  };

  const handleSave = async () => {
    if (!form.session_date || !form.court) return;
    setSaving(true);
    try {
      if (editing) await base44.entities.Session.update(editing.id, form);
      else         await base44.entities.Session.create(form);
      setShowDialog(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || !window.confirm("هل أنت متأكد من حذف هذه الجلسة؟")) return;
    setDeleting(true);
    try {
      await base44.entities.Session.delete(editing.id);
      setShowDialog(false);
      await loadData();
    } finally {
      setDeleting(false);
    }
  };

  // ── فلترة ─────────────────────────────────────────────────────────────────
  const filtered = sessions.filter(s => {
    const matchSearch = searchInFields(s, ["case_title", "client_name", "court", "hall", "result"], search);
    const matchStatus = statusFilter === "الكل" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── بيانات التقويم ────────────────────────────────────────────────────────
  const calendarItems = useMemo(() => {
    const si = filtered.map(s => ({ ...s, _src: "جلسة",  _date: s.session_date, _label: s.case_title  }));
    const ti = tasks.filter(t => t.due_date).map(t  => ({ ...t, _src: "مهمة",   _date: t.due_date,    _label: t.title  }));
    const ei = events.filter(e => e.date).map(e     => ({ ...e, _src: "موعد",   _date: e.date,        _label: e.title  }));
    return [...si, ...ti, ...ei]
      .filter(item => !!safeDate(item._date))
      .sort((a, b) => new Date(a._date) - new Date(b._date));
  }, [filtered, tasks, events]);

  const monthDays = useMemo(() =>
    eachDayOfInterval({
      start: startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 6 }),
      end:   endOfWeek(endOfMonth(anchorDate),     { weekStartsOn: 6 }),
    }), [anchorDate]);

  const weekDays = useMemo(() =>
    eachDayOfInterval({
      start: startOfWeek(anchorDate, { weekStartsOn: 6 }),
      end:   endOfWeek(anchorDate,   { weekStartsOn: 6 }),
    }), [anchorDate]);

  const getItemsForDay = (day) =>
    calendarItems.filter(item => isSameDay(safeDate(item._date), day));

  const navPrev = () => setAnchorDate(d => viewMode === "week" ? subWeeks(d, 1) : subMonths(d, 1));
  const navNext = () => setAnchorDate(d => viewMode === "week" ? addWeeks(d, 1) : addMonths(d, 1));

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <PageHeader
        title="الجلسات والتقويم"
        subtitle={`${sessions.length} جلسة · ${tasks.length} مهمة · ${events.length} موعد`}
        action={<Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" />إضافة جلسة</Button>}
      />

      {/* شريط التحكم */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_auto] gap-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input ref={searchRef} placeholder="بحث في الجلسات أو المحكمة أو الموكل..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-11" />
        </div>
        <ChoiceInput value={statusFilter} onChange={setStatusFilter} options={["الكل", ...STATUSES]} listId="sessions-status-filter" helper="" className="xl:w-40 h-11" />
        <ChoiceInput
          value={viewMode === "month" ? "شهري" : viewMode === "week" ? "أسبوعي" : "قائمة"}
          onChange={v => setViewMode(v === "شهري" ? "month" : v === "أسبوعي" ? "week" : "list")}
          options={["شهري", "أسبوعي", "قائمة"]} listId="calendar-view-mode" helper="" className="xl:w-36 h-11"
        />
      </div>

      {/* بطاقة التنقل */}
      {viewMode !== "list" && (
        <Card className="p-4 border-primary/10 bg-primary/5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold">تقويم مهني موحد</p>
              <p className="text-sm text-muted-foreground">يعرض الجلسات والمهام والمواعيد معاً.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={navPrev}><ChevronRight className="h-4 w-4" /></Button>
              <div className="min-w-[150px] text-center font-bold text-sm">
                {viewMode === "week" ? `${safeFmt(weekDays[0], "dd/MM")} – ${safeFmt(weekDays[6], "dd/MM/yyyy")}` : safeFmt(anchorDate, "MMMM yyyy", "")}
              </div>
              <Button variant="outline" size="icon" onClick={navNext}><ChevronLeft className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      )}

      {/* المحتوى */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : loadError ? (
        <PageErrorState message={loadError} onRetry={loadData} />

      ) : viewMode === "list" ? (
        filtered.length === 0 ? (
          <EmptyState icon={CalendarDays} title="لا توجد جلسات" description="أضف جلستك الأولى" action={<Button onClick={openCreate}>إضافة جلسة</Button>} />
        ) : (
          <div className="space-y-3">
            {filtered.map(session => (
              <Card key={session.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(session)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    {safeDate(session.session_date) ? (
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-lg leading-none">{safeFmt(session.session_date, "dd")}</span>
                        <span className="text-primary text-[10px]">{safeFmt(session.session_date, "MMM")}</span>
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <CalendarDays className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">{session.case_title || "بدون قضية"}</h3>
                      <p className="text-sm text-muted-foreground">{session.client_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {session.court  && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{session.court}</span>}
                        {safeDate(session.session_date) && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{safeFmt(session.session_date, "HH:mm")}</span>}
                        {session.hall   && <span>قاعة {session.hall}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    {session.session_date && (
                      <a href={buildGoogleCalendarUrl(session)} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors">
                        📅 أضف لـ Google
                      </a>
                    )}
                    <StatusBadge status={session.status} />
                    <span className="text-xs text-muted-foreground">{session.session_type}</span>
                    <ActionButtons entityName="Session" record={session} onEdit={openEdit} onDeleted={loadData} size="sm" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )

      ) : viewMode === "month" ? (
        <div className="grid grid-cols-7 gap-1.5">
          {["سبت","أحد","اثن","ثلا","أرب","خمس","جمع"].map(d => (
            <div key={d} className="text-center text-xs text-muted-foreground font-semibold py-1">{d}</div>
          ))}
          {monthDays.map(day => {
            const items = getItemsForDay(day);
            const isCurrentMonth = isSameMonth(day, anchorDate);
            const isToday = isSameDay(day, new Date());
            return (
              <Card key={day.toISOString()} className={`p-2 min-h-[110px] transition-opacity ${!isCurrentMonth ? "opacity-40" : ""} ${isToday ? "ring-2 ring-primary/50" : ""}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  {items.length > 0 && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">{items.length}</Badge>}
                </div>
                <div className="space-y-1">
                  {items.slice(0, 3).map((item, idx) => (
                    <button
                      key={`${item._src}-${item.id || idx}`}
                      onClick={() => item._src === "جلسة" && openEdit(item)}
                      className={`w-full text-right rounded-lg px-1.5 py-1 text-[10px] leading-tight truncate transition-colors ${
                        item._src === "جلسة" ? "bg-primary/15 text-primary hover:bg-primary/25 cursor-pointer" :
                        item._src === "مهمة" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" :
                        "bg-green-500/15 text-green-700 dark:text-green-300"
                      }`}
                    >
                      <div className="font-semibold truncate">{item._label || "—"}</div>
                      <div className="opacity-70">{item._src} · {safeFmt(item._date, "HH:mm")}</div>
                    </button>
                  ))}
                  {items.length > 3 && (
                    <p className="text-[10px] text-muted-foreground text-center">+{items.length - 3} أخرى</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {weekDays.map(day => {
            const items  = getItemsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <Card key={day.toISOString()} className={`p-4 ${isToday ? "ring-2 ring-primary/50" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-sm">{safeFmt(day, "EEEE")}</p>
                    <p className="text-xs text-muted-foreground">{safeFmt(day, "dd/MM")}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">لا شيء مجدول</p>
                  ) : items.map((item, idx) => (
                    <div
                      key={`${item._src}-${item.id || idx}`}
                      onClick={() => item._src === "جلسة" && openEdit(item)}
                      className={`rounded-2xl border border-border p-2.5 text-xs ${item._src === "جلسة" ? "cursor-pointer hover:bg-muted/50" : ""}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item._src === "جلسة" ? "bg-primary" : item._src === "مهمة" ? "bg-amber-500" : "bg-green-500"}`} />
                        <span className="font-semibold truncate">{item._label}</span>
                      </div>
                      <p className="text-muted-foreground">{item._src} · {safeFmt(item._date, "HH:mm")}</p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* نافذة الإضافة/التعديل */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل الجلسة" : "إضافة جلسة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 md:col-span-2">
              <Label>القضية</Label>
              <ChoiceInput value={form.case_title} onChange={handleCaseSelect} options={cases.map(c => c.title)} listId="cases-list-ses" helper="" />
            </div>
            <div className="space-y-1">
              <Label>تاريخ الجلسة *</Label>
              <DateSmartInput type="datetime-local" value={form.session_date} onChange={v => setForm(f => ({ ...f, session_date: v }))} />
            </div>
            <div className="space-y-1">
              <Label>نوع الجلسة</Label>
              <ChoiceInput value={form.session_type} onChange={v => setForm(f => ({ ...f, session_type: v }))} options={SESSION_TYPES} listId="session-types" helper="" />
            </div>
            <div className="space-y-1">
              <Label>المحكمة *</Label>
              <Input value={form.court} onChange={e => setForm(f => ({ ...f, court: e.target.value }))} className="h-11" placeholder="اسم المحكمة" />
            </div>
            <div className="space-y-1">
              <Label>القاعة</Label>
              <Input value={form.hall} onChange={e => setForm(f => ({ ...f, hall: e.target.value }))} className="h-11" placeholder="رقم أو اسم القاعة" />
            </div>
            <div className="space-y-1">
              <Label>الحالة</Label>
              <ChoiceInput value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={STATUSES} listId="session-statuses" helper="" />
            </div>
            <div className="space-y-1">
              <Label>الجلسة التالية</Label>
              <DateSmartInput type="datetime-local" value={form.next_session_date} onChange={v => setForm(f => ({ ...f, next_session_date: v }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>نتيجة الجلسة</Label>
              <Input value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))} className="h-11" placeholder="ملخص ما تم..." />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>ملاحظات</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="min-h-[80px]" />
            </div>
          </div>
          <div className="flex justify-between gap-3 mt-4">
            <div>
              {editing && (
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />{deleting ? "جارٍ الحذف..." : "حذف"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
              <Button onClick={handleSave} disabled={saving || !form.session_date || !form.court} className="bg-primary text-white">
                {saving ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "إضافة"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

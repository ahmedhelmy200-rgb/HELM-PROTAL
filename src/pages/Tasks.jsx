import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, CheckSquare, Clock } from "lucide-react";
import { format, isToday, isPast } from "date-fns";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";

const TASK_TYPES = ["تقديم مستند", "مراجعة عقد", "رد على مذكرة", "تحضير جلسة", "متابعة موكل", "مهمة عامة"];
const PRIORITIES = ["عالية", "متوسطة", "منخفضة"];

const emptyForm = { title: "", description: "", case_id: "", case_title: "", client_name: "", task_type: "مهمة عامة", priority: "متوسطة", due_date: "", status: "معلقة", assigned_to: "" };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("غير مكتملة");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    setLoading(true);
    const [t, c] = await Promise.all([base44.entities.Task.list("-due_date"), base44.entities.Case.list()]);
    setTasks(t); setCases(c); setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (t) => { setEditing(t); setForm({ ...emptyForm, ...t, due_date: t.due_date?.slice(0,16) || "" }); setShowDialog(true); };

  const toggleComplete = async (task) => {
    const newStatus = task.status === "مكتملة" ? "معلقة" : "مكتملة";
    await base44.entities.Task.update(task.id, { status: newStatus });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
  };

  const handleSave = async () => {
    setSaving(true);
    if (editing) await base44.entities.Task.update(editing.id, form);
    else await base44.entities.Task.create(form);
    setShowDialog(false);
    await loadData();
    setSaving(false);
  };

  const filtered = tasks.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !search || t.title?.toLowerCase().includes(q) || t.case_title?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "الكل" ? true : statusFilter === "غير مكتملة" ? t.status !== "مكتملة" : t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getDateStyle = (dueDate, status) => {
    if (status === "مكتملة") return "text-muted-foreground";
    const d = new Date(dueDate);
    if (isPast(d)) return "text-destructive font-medium";
    if (isToday(d)) return "text-accent font-medium";
    return "text-muted-foreground";
  };

  return (
    <div>
      <PageHeader
        title="المهام"
        subtitle={`${tasks.filter(t => t.status !== "مكتملة").length} مهمة غير مكتملة`}
        action={<Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" />إضافة مهمة</Button>}
      />
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في المهام..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="غير مكتملة">غير مكتملة</SelectItem>
            <SelectItem value="الكل">الكل</SelectItem>
            <SelectItem value="معلقة">معلقة</SelectItem>
            <SelectItem value="جارية">جارية</SelectItem>
            <SelectItem value="مكتملة">مكتملة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="لا توجد مهام" action={<Button onClick={openCreate}>إضافة مهمة</Button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <Card key={task.id} className={`p-4 hover:shadow-sm transition-all ${task.status === "مكتملة" ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <Checkbox checked={task.status === "مكتملة"} onCheckedChange={() => toggleComplete(task)} className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(task)}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-medium text-sm ${task.status === "مكتملة" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                    <StatusBadge status={task.priority} isPriority />
                  </div>
                  {task.case_title && <p className="text-xs text-muted-foreground mt-0.5">{task.case_title}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{task.task_type}</span>
                    {task.due_date && (
                      <span className={`text-xs flex items-center gap-0.5 ${getDateStyle(task.due_date, task.status)}`}>
                        <Clock className="h-3 w-3" />
                        {format(new Date(task.due_date), "dd/MM/yyyy - HH:mm")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "تعديل المهمة" : "إضافة مهمة"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 col-span-2"><Label>عنوان المهمة *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="space-y-1"><Label>نوع المهمة</Label>
              <Select value={form.task_type} onValueChange={v => setForm({...form, task_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>الأولوية</Label>
              <Select value={form.priority} onValueChange={v => setForm({...form, priority: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2"><Label>الموعد النهائي *</Label><Input type="datetime-local" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></div>
            <div className="space-y-1 col-span-2"><Label>القضية المرتبطة</Label>
              <Input list="cases-tasks" value={form.case_title} onChange={e => { const c = cases.find(c => c.title === e.target.value); setForm({...form, case_title: e.target.value, case_id: c?.id || "", client_name: c?.client_name || form.client_name}); }} placeholder="اختياري" />
              <datalist id="cases-tasks">{cases.map(c => <option key={c.id} value={c.title} />)}</datalist>
            </div>
            <div className="space-y-1 col-span-2"><Label>وصف المهمة</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="h-20" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.due_date} className="bg-primary text-white">
              {saving ? "جارٍ الحفظ..." : editing ? "حفظ" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
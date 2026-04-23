import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, CheckSquare, Clock } from "lucide-react";
import { format, isToday, isPast } from "date-fns";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";
import ChoiceInput from "@/components/shared/ChoiceInput";
import DateSmartInput from "@/components/shared/DateSmartInput";
import ActionButtons from "@/components/shared/ActionButtons";
import { PageErrorState } from "@/components/app/AppStatusBar";

const TASK_TYPES = ["تقديم مستند", "مراجعة عقد", "رد على مذكرة", "تحضير جلسة", "متابعة موكل", "مهمة عامة"];
const PRIORITIES = ["عالية", "متوسطة", "منخفضة"];
const STATUSES = ["معلقة", "جارية", "مكتملة"];

const emptyForm = { title: "", description: "", case_id: "", case_title: "", client_name: "", task_type: "مهمة عامة", priority: "متوسطة", due_date: "", status: "معلقة", assigned_to: "" };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    setLoading(true);
    const [taskRows, caseRows] = await Promise.all([base44.entities.Task.list("-due_date"), base44.entities.Case.list()]);
    setTasks(taskRows); setCases(caseRows); setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (task) => { setEditing(task); setForm({ ...emptyForm, ...task, due_date: task.due_date?.slice(0, 16) || "" }); setShowDialog(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await base44.entities.Task.update(editing.id, form);
      else await base44.entities.Task.create(form);
      setShowDialog(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (task) => {
    await base44.entities.Task.update(task.id, { status: task.status === "مكتملة" ? "معلقة" : "مكتملة" });
    await loadData();
  };

  const filtered = tasks.filter(task => {
    const q = search.toLowerCase();
    const matchSearch = !search || task.title?.toLowerCase().includes(q) || task.case_title?.toLowerCase().includes(q) || task.client_name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "الكل" || task.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <PageHeader title="المهام" subtitle={`${tasks.length} مهمة`} action={<Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" />إضافة مهمة</Button>} />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في المهام..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-11" />
        </div>
        <ChoiceInput value={statusFilter} onChange={setStatusFilter} options={["الكل", ...STATUSES]} listId="task-status-filter" helper="" className="sm:w-40 h-11" />
      </div>

      {loadError && <PageErrorState message={loadError} onRetry={loadData} />}
      {!loadError && loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !loadError && filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="لا توجد مهام" description="ابدأ بإضافة أول مهمة" action={<Button onClick={openCreate}>إضافة مهمة</Button>} />
      ) : (
        <div className="space-y-3">
          {filtered.map(task => {
            const dueDate = task.due_date ? new Date(task.due_date) : null;
            const overdue = dueDate && task.status !== "مكتملة" && isPast(dueDate) && !isToday(dueDate);
            return (
              <Card key={task.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(task)}>
                <div className="flex items-start gap-3">
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={task.status === "مكتملة"} onCheckedChange={() => toggleDone(task)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold ${task.status === 'مكتملة' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</h3>
                      <StatusBadge status={task.priority} isPriority />
                      <StatusBadge status={task.status} />
                    </div>
                    {task.case_title && <p className="text-sm text-muted-foreground mt-1">{task.case_title}</p>}
                    {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                  </div>
                  <div className="text-left shrink-0 flex flex-col items-end gap-2">
                    {dueDate && <p className={`text-xs flex items-center gap-1 ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}><Clock className="h-3 w-3" />{format(dueDate, 'yyyy/MM/dd HH:mm')}</p>}
                    {task.task_type && <p className="text-xs text-muted-foreground">{task.task_type}</p>}
                    <ActionButtons entityName="Task" record={task} onEdit={openEdit} onDeleted={loadData} size="sm" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "تعديل المهمة" : "إضافة مهمة"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 md:col-span-2"><Label>عنوان المهمة *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="h-11" /></div>
            <div className="space-y-1"><Label>نوع المهمة</Label><ChoiceInput value={form.task_type} onChange={v => setForm({...form, task_type: v})} options={TASK_TYPES} listId="task-types" /></div>
            <div className="space-y-1"><Label>الأولوية</Label><ChoiceInput value={form.priority} onChange={v => setForm({...form, priority: v})} options={PRIORITIES} listId="task-priority" /></div>
            <div className="space-y-1 md:col-span-2"><Label>الموعد النهائي *</Label><DateSmartInput type="datetime-local" value={form.due_date} onChange={v => setForm({...form, due_date: v})} /></div>
            <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={v => setForm({...form, status: v})} options={STATUSES} listId="task-statuses" /></div>
            <div className="space-y-1"><Label>القضية المرتبطة</Label>
              <ChoiceInput value={form.case_title} onChange={value => { const selected = cases.find(c => c.title === value); setForm({...form, case_title: value, case_id: selected?.id || "", client_name: selected?.client_name || form.client_name}); }} options={cases.map(c => c.title)} listId="cases-tasks" />
            </div>
            <div className="space-y-1 md:col-span-2"><Label>وصف المهمة</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="min-h-[100px]" /></div>
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

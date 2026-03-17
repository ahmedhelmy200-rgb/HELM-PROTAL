import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Users, Phone, Mail } from "lucide-react";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";

const emptyForm = { full_name: "", client_type: "فرد", id_number: "", phone: "", email: "", address: "", nationality: "", notes: "", status: "نشط" };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { setLoading(true); const c = await base44.entities.Client.list("-created_date"); setClients(c); setLoading(false); };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...emptyForm, ...c }); setShowDialog(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editing) await base44.entities.Client.update(editing.id, form);
    else await base44.entities.Client.create(form);
    setShowDialog(false);
    await loadData();
    setSaving(false);
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return !search || c.full_name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader
        title="الموكلون"
        subtitle={`${clients.length} موكل`}
        action={<Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" />إضافة موكل</Button>}
      />
      <div className="relative mb-5">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="بحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد موكلون" description="ابدأ بإضافة موكلك الأول" action={<Button onClick={openCreate}>إضافة موكل</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(c => (
            <Card key={c.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(c)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{c.full_name?.[0]}</div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{c.full_name}</h3>
                      <p className="text-xs text-muted-foreground">{c.client_type}</p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    {c.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</p>}
                    {c.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</p>}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "تعديل الموكل" : "إضافة موكل"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 col-span-2"><Label>الاسم الكامل *</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
            <div className="space-y-1"><Label>نوع الموكل</Label>
              <Select value={form.client_type} onValueChange={v => setForm({...form, client_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="فرد">فرد</SelectItem><SelectItem value="شركة">شركة</SelectItem><SelectItem value="مؤسسة">مؤسسة</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="نشط">نشط</SelectItem><SelectItem value="غير نشط">غير نشط</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>رقم الهوية / السجل</Label><Input value={form.id_number} onChange={e => setForm({...form, id_number: e.target.value})} /></div>
            <div className="space-y-1"><Label>رقم الهاتف *</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div className="space-y-1"><Label>البريد الإلكتروني</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div className="space-y-1"><Label>الجنسية</Label><Input value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} /></div>
            <div className="space-y-1 col-span-2"><Label>العنوان</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
            <div className="space-y-1 col-span-2"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="h-20" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || !form.full_name || !form.phone} className="bg-primary text-white">
              {saving ? "جارٍ الحفظ..." : editing ? "حفظ" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Phone, Mail, MessageCircle, Briefcase, FileText, BellRing, Clock3, Building2 } from "lucide-react";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";
import StatCard from "@/components/helm/StatCard";
import ChoiceInput from "@/components/shared/ChoiceInput";

const emptyForm = {
  full_name: "",
  client_type: "فرد",
  id_number: "",
  phone: "",
  email: "",
  address: "",
  nationality: "",
  notes: "",
  status: "نشط",
};

const CLIENT_TYPES = ["فرد", "شركة", "مؤسسة", "جهة حكومية", "ورثة"];
const CLIENT_STATUSES = ["نشط", "غير نشط", "مهمل"];
const COMMON_NATIONALITIES = ["الإمارات", "مصر", "السعودية", "الهند", "باكستان", "سوريا", "الأردن", "السودان"];

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysSince(value) {
  const date = toDate(value);
  if (!date) return null;
  const now = new Date();
  return Math.floor((now - date) / (1000 * 60 * 60 * 24));
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [officeSettings, setOfficeSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [clientsData, casesData, sessionsData, documentsData, invoicesData, settings] = await Promise.all([
      base44.entities.Client.list("-created_date"),
      base44.entities.Case.list("-created_date"),
      base44.entities.Session.list("-session_date"),
      base44.entities.Document.list("-created_date"),
      base44.entities.Invoice.list("-created_date"),
      base44.entities.OfficeSettings.list(),
    ]);
    setClients(clientsData);
    setCases(casesData);
    setSessions(sessionsData);
    setDocuments(documentsData);
    setInvoices(invoicesData);
    setOfficeSettings(settings?.[0] || null);
    setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (client) => { setEditing(client); setForm({ ...emptyForm, ...client }); setShowDialog(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, status: form.status === 'مهمل' ? 'غير نشط' : form.status };
      if (editing) await base44.entities.Client.update(editing.id, payload);
      else await base44.entities.Client.create(payload);
      setShowDialog(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const clientMetrics = useMemo(() => {
    return clients.map((client) => {
      const clientCases = cases.filter((item) => item.client_name === client.full_name);
      const clientSessions = sessions.filter((item) => item.client_name === client.full_name);
      const clientDocuments = documents.filter((item) => item.client_name === client.full_name);
      const clientInvoices = invoices.filter((item) => item.client_name === client.full_name);
      const activityDates = [
        client.created_date,
        ...clientCases.map((item) => item.updated_date || item.created_date || item.next_session_date),
        ...clientSessions.map((item) => item.updated_date || item.session_date),
        ...clientDocuments.map((item) => item.updated_date || item.created_date || item.submission_deadline),
        ...clientInvoices.map((item) => item.updated_date || item.created_date || item.issue_date),
      ]
        .map(toDate)
        .filter(Boolean)
        .sort((a, b) => b - a);

      const lastActivity = activityDates[0] || null;
      const inactivityDays = lastActivity ? daysSince(lastActivity.toISOString()) : null;
      const totalOpenInvoices = clientInvoices.filter((item) => !['مدفوعة', 'ملغاة'].includes(item.status)).length;
      const overdueInvoices = clientInvoices.filter((item) => item.status === 'متأخرة').length;
      const activeCases = clientCases.filter((item) => item.status === 'جارية').length;
      const isNeglected = (inactivityDays !== null && inactivityDays > 45) || (client.status === 'غير نشط' && activeCases === 0 && clientDocuments.length === 0);

      return {
        ...client,
        activeCases,
        sessionsCount: clientSessions.length,
        documentsCount: clientDocuments.length,
        invoicesCount: clientInvoices.length,
        overdueInvoices,
        totalOpenInvoices,
        lastActivity,
        inactivityDays,
        isNeglected,
      };
    });
  }, [clients, cases, sessions, documents, invoices]);

  const stats = useMemo(() => ({
    total: clientMetrics.length,
    active: clientMetrics.filter((item) => item.status === 'نشط').length,
    neglected: clientMetrics.filter((item) => item.isNeglected).length,
    companies: clientMetrics.filter((item) => item.client_type !== 'فرد').length,
  }), [clientMetrics]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clientMetrics.filter((client) => {
      const matchSearch = !q ||
        client.full_name?.toLowerCase().includes(q) ||
        client.phone?.includes(q) ||
        client.email?.toLowerCase().includes(q) ||
        client.id_number?.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (activeTab === 'active') return client.status === 'نشط';
      if (activeTab === 'neglected') return client.isNeglected;
      if (activeTab === 'companies') return client.client_type !== 'فرد';
      return true;
    });
  }, [clientMetrics, search, activeTab]);

  const sendReminder = async (client) => {
    const officeEmail = officeSettings?.email;
    if (officeEmail) {
      await base44.entities.Notification.create({
        title: 'تذكير متابعة موكل',
        message: `يرجى متابعة الموكل ${client.full_name}${client.phone ? ` - ${client.phone}` : ''}`,
        type: 'عام',
        reference_id: client.id,
        reference_type: 'Client',
        user_email: officeEmail,
      });
    }
    const message = encodeURIComponent(`مرحباً ${client.full_name}، نود متابعة ملفكم القانوني واستكمال أي بيانات أو مستندات لازمة. يرجى التواصل معنا.`);
    if (client.phone) window.open(`https://wa.me/${client.phone.replace(/\D+/g, '')}?text=${message}`, '_blank');
  };

  const actionTabs = [
    { key: 'all', label: 'كل الموكلين', count: stats.total },
    { key: 'active', label: 'النشطون', count: stats.active },
    { key: 'neglected', label: 'المهملون', count: stats.neglected },
    { key: 'companies', label: 'الشركات', count: stats.companies },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="الموكلون"
        subtitle={`${clients.length} موكل`}
        action={<Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" />إضافة موكل</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="إجمالي الموكلين" value={stats.total} icon={Users} color="primary" />
        <StatCard title="الموكلون النشطون" value={stats.active} icon={Briefcase} color="success" />
        <StatCard title="المهملون" value={stats.neglected} icon={Clock3} color="warning" subtitle="أكثر من 45 يوم بلا نشاط" />
        <StatCard title="الشركات والمؤسسات" value={stats.companies} icon={Building2} color="accent" />
      </div>

      <Card className="p-4 md:p-5 space-y-4 border-primary/10 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو الهاتف أو البريد أو رقم الهوية..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-11" />
          </div>
          <div className="flex flex-wrap gap-2">
            {actionTabs.map((tab) => (
              <Button
                key={tab.key}
                type="button"
                variant={activeTab === tab.key ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="mr-2 opacity-80">{tab.count}</span>
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="لا يوجد موكلون" description="ابدأ بإضافة موكلك الأول" action={<Button onClick={openCreate}>إضافة موكل</Button>} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <Card key={client.id} className="p-4 hover:shadow-lg transition-all hover:-translate-y-0.5 border border-border/70">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">{client.full_name?.[0]}</div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{client.full_name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{client.client_type || 'فرد'} {client.nationality ? `· ${client.nationality}` : ''}</p>
                      {client.inactivityDays !== null && (
                        <p className="text-[11px] text-muted-foreground mt-1">آخر نشاط منذ {client.inactivityDays} يوم</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={client.isNeglected ? 'متوقفة' : client.status} />
                    {client.isNeglected && <Badge className="bg-amber-100 text-amber-700 border border-amber-200">مهمل</Badge>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="rounded-xl bg-muted/40 px-3 py-2">
                    <p className="text-muted-foreground">القضايا</p>
                    <p className="font-bold text-foreground">{client.activeCases}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 px-3 py-2">
                    <p className="text-muted-foreground">الفواتير المفتوحة</p>
                    <p className="font-bold text-foreground">{client.totalOpenInvoices}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 px-3 py-2">
                    <p className="text-muted-foreground">المستندات</p>
                    <p className="font-bold text-foreground">{client.documentsCount}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 px-3 py-2">
                    <p className="text-muted-foreground">الجلسات</p>
                    <p className="font-bold text-foreground">{client.sessionsCount}</p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  {client.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{client.phone}</p>}
                  {client.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{client.email}</p>}
                  {client.id_number && <p className="text-xs text-muted-foreground">هوية/سجل: {client.id_number}</p>}
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => openEdit(client)}>فتح الملف</Button>
                  {client.phone && (
                    <Button variant="outline" size="sm" className="gap-1 text-xs text-green-700 border-green-200 hover:bg-green-50" onClick={() => window.open(`https://wa.me/${client.phone.replace(/\D+/g, '')}`, '_blank')}>
                      <MessageCircle className="h-3.5 w-3.5" /> واتساب
                    </Button>
                  )}
                  {client.email && (
                    <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => window.location.href = `mailto:${client.email}`}>
                      <Mail className="h-3.5 w-3.5" /> بريد
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-amber-700" onClick={() => sendReminder(client)}>
                    <BellRing className="h-3.5 w-3.5" /> تذكير
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "ملف الموكل" : "إضافة موكل"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 md:col-span-2"><Label>الاسم الكامل *</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="h-11" /></div>
            <div className="space-y-1"><Label>نوع الموكل</Label><ChoiceInput value={form.client_type} onChange={v => setForm({...form, client_type: v})} options={CLIENT_TYPES} listId="client-type-choices" /></div>
            <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={v => setForm({...form, status: v})} options={CLIENT_STATUSES} listId="client-status-choices" helper="يمكنك الكتابة أو اختيار حالة جاهزة" /></div>
            <div className="space-y-1"><Label>رقم الهوية / السجل</Label><Input value={form.id_number} onChange={e => setForm({...form, id_number: e.target.value})} className="h-11" /></div>
            <div className="space-y-1"><Label>رقم الهاتف *</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-11" /></div>
            <div className="space-y-1"><Label>البريد الإلكتروني</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-11" /></div>
            <div className="space-y-1"><Label>الجنسية</Label><ChoiceInput value={form.nationality} onChange={v => setForm({...form, nationality: v})} options={COMMON_NATIONALITIES} listId="client-nationality-choices" /></div>
            <div className="space-y-1 md:col-span-2"><Label>العنوان</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="h-11" /></div>
            <div className="space-y-1 md:col-span-2"><Label>ملاحظات داخلية</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="min-h-[110px]" /></div>
          </div>

          {editing && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">القضايا</p><p className="text-lg font-bold">{clientMetrics.find((item) => item.id === editing.id)?.activeCases || 0}</p></div>
              <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">الفواتير</p><p className="text-lg font-bold">{clientMetrics.find((item) => item.id === editing.id)?.invoicesCount || 0}</p></div>
              <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">المستندات</p><p className="text-lg font-bold">{clientMetrics.find((item) => item.id === editing.id)?.documentsCount || 0}</p></div>
              <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">النشاط</p><p className="text-lg font-bold">{clientMetrics.find((item) => item.id === editing.id)?.inactivityDays ?? 0}</p></div>
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-3 mt-5">
            <div className="flex flex-wrap gap-2">
              {editing?.phone && <Button type="button" variant="outline" onClick={() => window.open(`https://wa.me/${editing.phone.replace(/\D+/g, '')}`, '_blank')} className="gap-2"><MessageCircle className="h-4 w-4" /> واتساب</Button>}
              {editing?.email && <Button type="button" variant="outline" onClick={() => window.location.href = `mailto:${editing.email}`} className="gap-2"><Mail className="h-4 w-4" /> بريد</Button>}
              {editing && <Button type="button" variant="outline" onClick={() => sendReminder(editing)} className="gap-2"><BellRing className="h-4 w-4" /> تذكير متابعة</Button>}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
              <Button onClick={handleSave} disabled={saving || !form.full_name || !form.phone} className="bg-primary text-white">
                {saving ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "إضافة الموكل"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

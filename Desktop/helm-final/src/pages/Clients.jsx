import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
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
import { searchInFields } from "@/lib/search";
import { PageErrorState } from "@/components/app/AppStatusBar";
import PaginationControls from "@/components/shared/PaginationControls";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { APP_SHORTCUT_NEW, APP_SHORTCUT_SEARCH, subscribeAppEvent } from "@/lib/app-events";

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
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;
  const searchRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [
        { data: clientsData, total: totalClients },
        casesData,
        sessionsData,
        documentsData,
        invoicesData,
        settings,
      ] = await Promise.all([
        base44.entities.Client.listPage("-created_date", { page, pageSize }),
        base44.entities.Case.list("-created_date", 300),
        base44.entities.Session.list("-session_date", 300),
        base44.entities.Document.list("-created_date", 300),
        base44.entities.Invoice.list("-created_date", 300),
        base44.entities.OfficeSettings.list(),
      ]);
      setClients(clientsData);
      setTotal(totalClients);
      setCases(casesData);
      setSessions(sessionsData);
      setDocuments(documentsData);
      setInvoices(invoicesData);
      setOfficeSettings(settings?.[0] || null);
    } catch (error) {
      setLoadError(error.message || 'تعذر تحميل بيانات الموكلين.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);
  usePageRefresh(loadData, ['clients', 'cases', 'sessions', 'documents', 'invoices', 'office_settings']);

  useEffect(() => {
    const offNew = subscribeAppEvent(APP_SHORTCUT_NEW, ({ page }) => page === 'Clients' && openCreate());
    const offSearch = subscribeAppEvent(APP_SHORTCUT_SEARCH, ({ page }) => page === 'Clients' && searchRef.current?.focus());
    return () => { offNew(); offSearch(); };
  }, []);

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
        lastActivity,
        inactivityDays,
        isNeglected,
      };
    });
  }, [clients, cases, sessions, documents, invoices]);

  const stats = useMemo(() => ({
    total,
    active: clientMetrics.filter((item) => item.status === 'نشط').length,
    neglected: clientMetrics.filter((item) => item.isNeglected).length,
    companies: clientMetrics.filter((item) => item.client_type !== 'فرد').length,
  }), [clientMetrics, total]);

  const filtered = useMemo(() => {
    return clientMetrics.filter((client) => {
      const matchSearch = searchInFields(client, ['full_name', 'phone', 'email', 'id_number', 'address', 'nationality'], search);
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
        subtitle={`${total} موكل`}
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
            <Input ref={searchRef} placeholder="بحث بالاسم أو الهاتف أو البريد أو رقم الهوية..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-11" />
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
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : loadError ? (
        <PageErrorState message={loadError} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="لا توجد نتائج" description="غيّر المرشحات أو أضف موكلًا جديدًا." action={<Button onClick={openCreate}>إضافة موكل</Button>} />
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filtered.map((client) => (
              <Card key={client.id} className="p-5 border-primary/10 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg text-foreground">{client.full_name}</h3>
                      <StatusBadge status={client.status} />
                      {client.isNeglected && <Badge className="bg-warning/15 text-warning border-warning/20">مهمل</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{client.client_type} {client.nationality ? `· ${client.nationality}` : ''}</p>
                  </div>
                  <Button variant="outline" onClick={() => openEdit(client)}>فتح الملف</Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                  <div className="rounded-2xl bg-muted/40 p-3"><p className="text-muted-foreground text-xs">القضايا</p><p className="font-bold text-lg">{client.activeCases}</p></div>
                  <div className="rounded-2xl bg-muted/40 p-3"><p className="text-muted-foreground text-xs">الجلسات</p><p className="font-bold text-lg">{client.sessionsCount}</p></div>
                  <div className="rounded-2xl bg-muted/40 p-3"><p className="text-muted-foreground text-xs">المستندات</p><p className="font-bold text-lg">{client.documentsCount}</p></div>
                  <div className="rounded-2xl bg-muted/40 p-3"><p className="text-muted-foreground text-xs">الفواتير</p><p className="font-bold text-lg">{client.invoicesCount}</p></div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 text-sm text-muted-foreground">
                  {client.phone && <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" />{client.phone}</span>}
                  {client.email && <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" />{client.email}</span>}
                  {client.inactivityDays !== null && <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" />آخر نشاط منذ {client.inactivityDays} يوم</span>}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {client.phone && <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/${client.phone.replace(/\D+/g, '')}`, '_blank')}><MessageCircle className="h-4 w-4 ml-1" />واتساب</Button>}
                  {client.email && <Button variant="outline" size="sm" onClick={() => window.location.href = `mailto:${client.email}`}><Mail className="h-4 w-4 ml-1" />بريد</Button>}
                  <Button variant="outline" size="sm" onClick={() => sendReminder(client)}><BellRing className="h-4 w-4 ml-1" />تذكير</Button>
                </div>
              </Card>
            ))}
          </div>
          <PaginationControls page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "ملف الموكل" : "إضافة موكل جديد"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 md:col-span-2"><Label>الاسم الكامل *</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="h-11" /></div>
            <div className="space-y-1"><Label>الصفة</Label><ChoiceInput value={form.client_type} onChange={v => setForm({...form, client_type: v})} options={CLIENT_TYPES} listId="client-types" /></div>
            <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={v => setForm({...form, status: v})} options={CLIENT_STATUSES} listId="client-status" /></div>
            <div className="space-y-1"><Label>الهاتف</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-11" /></div>
            <div className="space-y-1"><Label>البريد</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-11" /></div>
            <div className="space-y-1"><Label>رقم الهوية</Label><Input value={form.id_number} onChange={e => setForm({...form, id_number: e.target.value})} className="h-11" /></div>
            <div className="space-y-1"><Label>الجنسية</Label><ChoiceInput value={form.nationality} onChange={v => setForm({...form, nationality: v})} options={COMMON_NATIONALITIES} listId="client-nationality" /></div>
            <div className="space-y-1 md:col-span-2"><Label>العنوان</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="h-11" /></div>
            <div className="space-y-1 md:col-span-2"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="min-h-[120px]" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || !form.full_name} className="bg-primary text-white">
              {saving ? "جارٍ الحفظ..." : editing ? "حفظ" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

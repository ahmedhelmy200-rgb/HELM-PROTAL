import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Phone, Mail, MessageCircle, Briefcase, FileText, Clock3, Building2 } from "lucide-react";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";
import StatCard from "@/components/helm/StatCard";
import ChoiceInput from "@/components/shared/ChoiceInput";
import ActionButtons from "@/components/shared/ActionButtons";
import { searchInFields } from "@/lib/search";
import { PageErrorState } from "@/components/app/AppStatusBar";
import PaginationControls from "@/components/shared/PaginationControls";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { APP_SHORTCUT_NEW, APP_SHORTCUT_SEARCH, subscribeAppEvent } from "@/lib/app-events";

const emptyForm = { full_name:"",client_type:"فرد",id_number:"",phone:"",email:"",address:"",nationality:"",notes:"",status:"نشط" };
const CLIENT_TYPES      = ["فرد","شركة","مؤسسة","جهة حكومية","ورثة"];
const CLIENT_STATUSES   = ["نشط","غير نشط","مهمل"];
const COMMON_NATS       = ["الإمارات","مصر","السعودية","الهند","باكستان","سوريا","الأردن","السودان"];

function toDate(v){ if(!v)return null; const d=new Date(v); return isNaN(d)?null:d; }
function daysSince(v){ const d=toDate(v); if(!d)return null; return Math.floor((new Date()-d)/86400000); }

export default function Clients() {
  const [clients,setClients]   = useState([]);
  const [cases,setCases]       = useState([]);
  const [sessions,setSessions] = useState([]);
  const [documents,setDocs]    = useState([]);
  const [invoices,setInvoices] = useState([]);
  const [officeSettings,setSettings] = useState(null);
  const [loading,setLoading]   = useState(true);
  const [loadError,setError]   = useState("");
  const [search,setSearch]     = useState("");
  const [showDialog,setDialog] = useState(false);
  const [editing,setEditing]   = useState(null);
  const [form,setForm]         = useState(emptyForm);
  const [saving,setSaving]     = useState(false);
  const [activeTab,setTab]     = useState("all");
  const [page,setPage]         = useState(1);
  const [total,setTotal]       = useState(0);
  const pageSize = 12;
  const searchRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [{data:cl,total:tot},cs,ss,ds,inv,sets] = await Promise.all([
        base44.entities.Client.listPage("-created_date",{page,pageSize}),
        base44.entities.Case.list("-created_date",300),
        base44.entities.Session.list("-session_date",300),
        base44.entities.Document.list("-created_date",300),
        base44.entities.Invoice.list("-created_date",300),
        base44.entities.OfficeSettings.list(),
      ]);
      setClients(cl); setTotal(tot); setCases(cs); setSessions(ss); setDocs(ds); setInvoices(inv); setSettings(sets?.[0]||null);
    } catch(e){ setError(e.message||"تعذر التحميل."); } finally { setLoading(false); }
  },[page]);

  useEffect(()=>{loadData();},[loadData]);
  usePageRefresh(loadData,['clients','cases','sessions','documents','invoices']);

  useEffect(()=>{
    const oN=subscribeAppEvent(APP_SHORTCUT_NEW,({page:p})=>p==='Clients'&&openCreate());
    const oS=subscribeAppEvent(APP_SHORTCUT_SEARCH,({page:p})=>p==='Clients'&&searchRef.current?.focus());
    return()=>{oN();oS();};
  },[]);

  const openCreate=()=>{setEditing(null);setForm(emptyForm);setDialog(true);};
  const openEdit=(c)=>{setEditing(c);setForm({...emptyForm,...c});setDialog(true);};

  const handleSave=async()=>{
    setSaving(true);
    try{
      if(editing)await base44.entities.Client.update(editing.id,form);
      else await base44.entities.Client.create(form);
      setDialog(false); await loadData();
    }finally{setSaving(false);}
  };

  const metrics = useMemo(()=>clients.map(c=>{
    const cCases=cases.filter(x=>x.client_name===c.full_name);
    const cSess=sessions.filter(x=>x.client_name===c.full_name);
    const cDocs=documents.filter(x=>x.client_name===c.full_name);
    const cInv=invoices.filter(x=>x.client_name===c.full_name);
    const dates=[c.created_date,...cCases.map(x=>x.updated_date||x.created_date),...cSess.map(x=>x.updated_date||x.session_date),...cDocs.map(x=>x.updated_date||x.created_date),...cInv.map(x=>x.updated_date||x.created_date)].map(toDate).filter(Boolean).sort((a,b)=>b-a);
    const lastAct=dates[0]||null;
    const inDays=lastAct?daysSince(lastAct.toISOString()):null;
    const overdue=cInv.filter(x=>x.status==='متأخرة').length;
    const active=cCases.filter(x=>x.status==='جارية').length;
    const neglected=(inDays!==null&&inDays>45)||(c.status==='غير نشط'&&active===0&&cDocs.length===0);
    return{...c,activeCases:active,sessionsCount:cSess.length,documentsCount:cDocs.length,invoicesCount:cInv.length,overdueInvoices:overdue,lastActivity:lastAct,inactivityDays:inDays,isNeglected:neglected};
  }),[clients,cases,sessions,documents,invoices]);

  const stats=useMemo(()=>({
    total,active:metrics.filter(c=>c.status==='نشط').length,
    neglected:metrics.filter(c=>c.isNeglected).length,
    companies:metrics.filter(c=>c.client_type!=='فرد').length,
  }),[metrics,total]);

  const filtered=useMemo(()=>metrics.filter(c=>{
    const ms=searchInFields(c,['full_name','phone','email','id_number','address','nationality'],search);
    if(!ms)return false;
    if(activeTab==='active')return c.status==='نشط';
    if(activeTab==='neglected')return c.isNeglected;
    if(activeTab==='companies')return c.client_type!=='فرد';
    return true;
  }),[metrics,search,activeTab]);

  const sendWhatsApp=(c)=>{
    const msg=encodeURIComponent(`مرحباً ${c.full_name}، نود متابعة ملفكم القانوني.`);
    if(c.phone)window.open(`https://wa.me/${c.phone.replace(/\D+/g,'')}?text=${msg}`,'_blank');
  };

  const TABS=[{key:'all',label:'الكل',count:stats.total},{key:'active',label:'النشطون',count:stats.active},{key:'neglected',label:'المهملون',count:stats.neglected},{key:'companies',label:'الشركات',count:stats.companies}];

  return (
    <div className="space-y-6">
      <PageHeader title="الموكلون" subtitle={`${total} موكل`}
        action={<Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4"/>إضافة موكل</Button>} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="إجمالي الموكلين"       value={stats.total}     icon={Users}     color="primary"/>
        <StatCard title="النشطون"               value={stats.active}    icon={Briefcase} color="success"/>
        <StatCard title="المهملون +45 يوم"      value={stats.neglected} icon={Clock3}    color="warning"/>
        <StatCard title="الشركات والمؤسسات"     value={stats.companies} icon={Building2} color="accent"/>
      </div>

      <Card className="p-4 space-y-3 border-primary/10">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <Input ref={searchRef} placeholder="بحث بالاسم أو الهاتف أو رقم الهوية..." value={search} onChange={e=>setSearch(e.target.value)} className="pr-10 h-11"/>
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map(t=>(
              <Button key={t.key} variant={activeTab===t.key?'default':'outline'} className="rounded-full h-9 gap-1.5" onClick={()=>setTab(t.key)}>
                {t.label}<span className="opacity-70 text-xs">{t.count}</span>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"/></div>
      ):loadError?(
        <PageErrorState message={loadError} onRetry={loadData}/>
      ):filtered.length===0?(
        <EmptyState icon={Users} title="لا توجد نتائج" description="غيّر الفلتر أو أضف موكلًا جديدًا." action={<Button onClick={openCreate}>إضافة موكل</Button>}/>
      ):(
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filtered.map(client=>(
              <Card key={client.id} className="p-5 border-primary/10 hover:shadow-md transition-all hover:border-primary/25">
                {/* ── رأس البطاقة ── */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-black text-lg">
                      {(client.full_name||'?')[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground">{client.full_name}</h3>
                        <StatusBadge status={client.status}/>
                        {client.isNeglected&&<Badge className="bg-warning/15 text-warning border-warning/20 text-[10px]">مهمل</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{client.client_type}{client.nationality?` · ${client.nationality}`:''}</p>
                    </div>
                  </div>
                  {/* ── أزرار الإجراءات ── */}
                  <ActionButtons
                    entityName="Client"
                    record={client}
                    onEdit={openEdit}
                    onDeleted={loadData}
                    size="sm"
                  />
                </div>

                {/* ── إحصائيات ── */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[{label:'القضايا',v:client.activeCases},{label:'الجلسات',v:client.sessionsCount},{label:'المستندات',v:client.documentsCount},{label:'الفواتير',v:client.invoicesCount}].map(s=>(
                    <div key={s.label} className="rounded-xl bg-muted/40 p-2.5 text-center">
                      <p className="font-black text-foreground text-lg leading-none">{s.v}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* ── معلومات ── */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                  {client.phone&&<span className="flex items-center gap-1"><Phone className="h-3 w-3"/>{client.phone}</span>}
                  {client.email&&<span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3"/>{client.email}</span>}
                  {client.inactivityDays!==null&&<span className="flex items-center gap-1"><Clock3 className="h-3 w-3"/>آخر نشاط {client.inactivityDays}ي</span>}
                  {client.overdueInvoices>0&&<Badge className="text-[10px] bg-destructive/10 text-destructive border-0">{client.overdueInvoices} فاتورة متأخرة</Badge>}
                </div>

                {/* ── أزرار التواصل ── */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" onClick={()=>openEdit(client)} className="gap-1.5 h-8">
                    <FileText className="h-3.5 w-3.5"/>فتح الملف
                  </Button>
                  {client.phone&&<Button variant="outline" size="sm" onClick={()=>sendWhatsApp(client)} className="gap-1.5 h-8"><MessageCircle className="h-3.5 w-3.5"/>واتساب</Button>}
                  {client.email&&<Button variant="outline" size="sm" onClick={()=>window.location.href=`mailto:${client.email}`} className="gap-1.5 h-8"><Mail className="h-3.5 w-3.5"/>بريد</Button>}
                </div>
              </Card>
            ))}
          </div>
          <PaginationControls page={page} pageSize={pageSize} total={total} onPageChange={setPage}/>
        </>
      )}

      <Dialog open={showDialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editing?"تعديل بيانات الموكل":"إضافة موكل جديد"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 md:col-span-2"><Label>الاسم الكامل *</Label><Input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} className="h-11"/></div>
            <div className="space-y-1"><Label>الصفة</Label><ChoiceInput value={form.client_type} onChange={v=>setForm({...form,client_type:v})} options={CLIENT_TYPES} listId="cl-types"/></div>
            <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={v=>setForm({...form,status:v})} options={CLIENT_STATUSES} listId="cl-status"/></div>
            <div className="space-y-1"><Label>الهاتف</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="h-11"/></div>
            <div className="space-y-1"><Label>البريد الإلكتروني</Label><Input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="h-11"/></div>
            <div className="space-y-1"><Label>رقم الهوية</Label><Input value={form.id_number} onChange={e=>setForm({...form,id_number:e.target.value})} className="h-11"/></div>
            <div className="space-y-1"><Label>الجنسية</Label><ChoiceInput value={form.nationality} onChange={v=>setForm({...form,nationality:v})} options={COMMON_NATS} listId="cl-nat"/></div>
            <div className="space-y-1 md:col-span-2"><Label>العنوان</Label><Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="h-11"/></div>
            <div className="space-y-1 md:col-span-2"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="min-h-[100px]"/></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={()=>setDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving||!form.full_name} className="bg-primary text-white">{saving?"جارٍ الحفظ...":editing?"حفظ التعديلات":"إضافة"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

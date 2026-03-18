import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Wand2, Copy, Download, ChevronLeft, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const CATEGORY_COLORS = {"عقود":"bg-blue-100 text-blue-700","صحائف دعوى":"bg-red-100 text-red-700","مذكرات":"bg-purple-100 text-purple-700","توكيلات":"bg-green-100 text-green-700","مراسلات":"bg-yellow-100 text-yellow-700","إشعارات":"bg-orange-100 text-orange-700","اتفاقيات":"bg-teal-100 text-teal-700","أخرى":"bg-gray-100 text-gray-700"};

function fillTemplate(content, caseData, clientData, officeSettings) {
  const today = new Date();
  const todayStr = format(today, "d MMMM yyyy", { locale: ar });
  const vars = {
    "[اسم الموكل]": clientData?.full_name || "________",
    "[اسم العميل]": clientData?.full_name || "________",
    "[اسم المدعي]": clientData?.full_name || "________",
    "[جنسية الموكل]": clientData?.nationality || "________",
    "[الجنسية]": clientData?.nationality || "________",
    "[رقم هوية الموكل]": clientData?.id_number || "________",
    "[رقم الهوية]": clientData?.id_number || "________",
    "[رقم الهوية/الجواز]": clientData?.id_number || "________",
    "[هاتف الموكل]": clientData?.phone || "________",
    "[عنوان الموكل]": clientData?.address || "________",
    "[رقم القضية]": caseData?.case_number || "________",
    "[عنوان القضية]": caseData?.title || "________",
    "[نوع القضية]": caseData?.case_type || "________",
    "[المحكمة]": caseData?.court || "________",
    "[القاضي]": caseData?.judge || "________",
    "[اسم الخصم]": caseData?.opponent_name || "________",
    "[محامي الخصم]": caseData?.opponent_lawyer || "________",
    "[الأتعاب]": caseData?.fees ? `${caseData.fees.toLocaleString('ar')}` : "________",
    "[المبلغ]": caseData?.fees ? `${caseData.fees.toLocaleString('ar')}` : "________",
    "[تاريخ الرفع]": caseData?.filing_date ? format(new Date(caseData.filing_date), "d/M/yyyy") : "________",
    "[تاريخ الجلسة القادمة]": caseData?.next_session_date ? format(new Date(caseData.next_session_date), "d/M/yyyy") : "________",
    "[وصف القضية]": caseData?.description || "________",
    "[اسم المحامي]": officeSettings?.lawyer_name || "________",
    "[اسم المكتب]": officeSettings?.office_name || "________",
    "[رقم الترخيص]": officeSettings?.license_number || "________",
    "[هاتف المكتب]": officeSettings?.phone || "________",
    "[عنوان المكتب]": officeSettings?.address || "________",
    "[التاريخ]": todayStr,
    "[تاريخ اليوم]": todayStr,
    "[السنة]": today.getFullYear().toString(),
    "[اليوم]": format(today, "EEEE", { locale: ar }),
  };

  let result = content;
  Object.entries(vars).forEach(([key, val]) => {
    result = result.split(key).join(val);
  });
  return result;
}

export default function GenerateDocumentDialog({ open, onClose, initialTemplate = null }) {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [cases, setCases] = useState([]);
  const [officeSettings, setOfficeSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate?.id || "");
  const [selectedCase, setSelectedCase] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
      if (initialTemplate) {
        setSelectedTemplate(initialTemplate.id);
        setStep(1);
      }
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    const [tmpl, cs, os] = await Promise.all([
      base44.entities.LegalTemplate.list("-created_date"),
      base44.entities.Case.list("-created_date", 50),
      base44.entities.OfficeSettings.list(),
    ]);
    setTemplates(tmpl); setCases(cs); setOfficeSettings(os[0] || null); setLoading(false);
  };

  const handleGenerate = async () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;
    setGenerating(true);
    let caseData = null; let clientData = null;
    if (selectedCase) {
      caseData = cases.find(c => c.id === selectedCase);
      if (caseData?.client_id) {
        try {
          const clients = await base44.entities.Client.filter({ id: caseData.client_id });
          clientData = clients[0] || null;
        } catch {}
      }
    }
    const filled = fillTemplate(template.content, caseData, clientData, officeSettings);
    setGeneratedContent(filled); setGenerating(false); setStep(2);
  };

  const handlePrint = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    const win = window.open("", "_blank");
    win.document.write(`
      <html dir="rtl"><head><title>${template?.title || "وثيقة قانونية"}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet"><style>body { font-family: 'Cairo', Arial; padding: 40px; line-height: 1.9; direction: rtl; font-size: 14px; color: #1a1a1a; } h1 { color: #1d4ed8; border-bottom: 3px solid #1d4ed8; padding-bottom: 10px; font-size: 18px; } pre { white-space: pre-wrap; font-family: 'Cairo', Arial; font-size: 14px; line-height: 2; } .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0; } .office-info { font-size: 12px; color: #64748b; } @media print { body { -webkit-print-color-adjust: exact; } }</style></head><body><div class="header"><div><h1>${template?.title || "وثيقة قانونية"}</h1></div><div class="office-info"><strong>${officeSettings?.office_name || ""}</strong><br/>${officeSettings?.phone || ""}${officeSettings?.phone ? "<br/>" : ""}${new Date().toLocaleDateString('ar-AE')}</div></div><pre>${generatedContent}</pre><script>window.onload = () => { window.print(); };</script></body></html>`);
    win.document.close();
  };

  const handleClose = () => { setStep(1); setSelectedTemplate(initialTemplate?.id || ""); setSelectedCase(""); setGeneratedContent(""); onClose(); };
  const selectedCaseData = cases.find(c => c.id === selectedCase);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" />توليد وثيقة قانونية تلقائياً</DialogTitle></DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : step === 1 ? (
          <div className="space-y-5 mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3"><span className="h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span><span className="font-medium text-foreground">اختر النموذج والقضية</span><ChevronLeft className="h-3 w-3 mx-1" /><span className="h-5 w-5 rounded-full bg-muted-foreground/20 text-muted-foreground text-xs flex items-center justify-center">2</span>معاينة وتصدير</div>
            <div className="space-y-2"><Label className="font-medium">النموذج القانوني *</Label><Select value={selectedTemplate} onValueChange={setSelectedTemplate}><SelectTrigger className="h-11"><SelectValue placeholder="اختر النموذج المراد توليده..." /></SelectTrigger><SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}><div className="flex items-center gap-2"><span>{t.title}</span><span className={`text-xs px-1.5 py-0.5 rounded ${CATEGORY_COLORS[t.category] || "bg-gray-100"}`}>{t.category}</span></div></SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="font-medium">القضية (اختياري — لملء بيانات الموكل والقضية تلقائياً)</Label><Select value={selectedCase} onValueChange={setSelectedCase}><SelectTrigger className="h-11"><SelectValue placeholder="اختر القضية لملء البيانات تلقائياً..." /></SelectTrigger><SelectContent><SelectItem value="none_selected">— بدون قضية محددة —</SelectItem>{cases.map(c => <SelectItem key={c.id} value={c.id}><div className="flex items-center gap-2">{c.case_number && <span className="text-muted-foreground text-xs">#{c.case_number}</span>}<span>{c.title}</span><span className="text-muted-foreground text-xs">— {c.client_name}</span></div></SelectItem>)}</SelectContent></Select></div>
            {selectedCaseData && (<div className="p-4 rounded-xl bg-primary/5 border border-primary/20 grid grid-cols-2 gap-3 text-sm"><div><span className="text-muted-foreground text-xs">الموكل:</span><p className="font-medium">{selectedCaseData.client_name || "—"}</p></div><div><span className="text-muted-foreground text-xs">نوع القضية:</span><p className="font-medium">{selectedCaseData.case_type || "—"}</p></div><div><span className="text-muted-foreground text-xs">المحكمة:</span><p className="font-medium">{selectedCaseData.court || "—"}</p></div><div><span className="text-muted-foreground text-xs">الخصم:</span><p className="font-medium">{selectedCaseData.opponent_name || "—"}</p></div>{selectedCaseData.fees > 0 && (<div><span className="text-muted-foreground text-xs">الأتعاب:</span><p className="font-medium">{selectedCaseData.fees?.toLocaleString('ar')} {officeSettings?.currency || "د.إ"}</p></div>)}</div>)}
            <div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={handleClose}>إلغاء</Button><Button onClick={handleGenerate} disabled={!selectedTemplate || generating} className="bg-primary text-white gap-2">{generating ? <><RefreshCw className="h-4 w-4 animate-spin" /> جارٍ التوليد...</> : <><Wand2 className="h-4 w-4" /> توليد الوثيقة</>}</Button></div>
          </div>
        ) : (
          <div className="space-y-4 mt-2"><div className="flex items-center gap-2 text-xs text-muted-foreground bg-green-50 rounded-xl p-3 border border-green-100"><span className="h-5 w-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">✓</span><span className="text-green-700 font-medium">تم توليد الوثيقة بنجاح!</span><span className="mr-auto text-muted-foreground">يمكنك تعديل النص قبل الطباعة</span></div><div className="space-y-1.5"><Label className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />الوثيقة المُولَّدة (قابلة للتعديل)</Label><Textarea value={generatedContent} onChange={e => setGeneratedContent(e.target.value)} className="h-96 font-mono text-sm leading-relaxed" dir="rtl" /></div><div className="flex flex-wrap gap-2 justify-between items-center pt-1"><Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ChevronLeft className="h-4 w-4 rotate-180" /> تغيير الاختيار</Button><div className="flex gap-2"><Button variant="outline" onClick={() => navigator.clipboard.writeText(generatedContent)} className="gap-2"><Copy className="h-4 w-4" /> نسخ النص</Button><Button onClick={handlePrint} className="bg-primary text-white gap-2"><Download className="h-4 w-4" /> طباعة / تصدير PDF</Button></div></div></div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Search, FileText, Star, StarOff, Edit, Trash2, Copy, Download,
  BookOpen, Filter, ChevronDown, Wand2
} from "lucide-react";
import PageHeader from "../components/helm/PageHeader";
import EmptyState from "../components/helm/EmptyState";
import GenerateDocumentDialog from "../components/helm/GenerateDocumentDialog";

const CATEGORIES = ["عقود", "صحائف دعوى", "مذكرات", "توكيلات", "مراسلات", "إشعارات", "اتفاقيات", "أخرى"];
const CASE_TYPES = ["عام", "مدني", "جزائي", "تجاري", "عمالي", "أسري", "إداري", "عقاري"];

const CATEGORY_COLORS = {
  "عقود": "bg-blue-100 text-blue-700",
  "صحائف دعوى": "bg-red-100 text-red-700",
  "مذكرات": "bg-purple-100 text-purple-700",
  "توكيلات": "bg-green-100 text-green-700",
  "مراسلات": "bg-yellow-100 text-yellow-700",
  "إشعارات": "bg-orange-100 text-orange-700",
  "اتفاقيات": "bg-teal-100 text-teal-700",
  "أخرى": "bg-gray-100 text-gray-700",
};

const emptyForm = {
  title: "", category: "عقود", case_type: "عام", content: "", description: "", is_favorite: false
};

// Sample templates
const SAMPLE_TEMPLATES = [
  {
    title: "عقد اتفاقية أتعاب محاماة",
    category: "عقود",
    case_type: "عام",
    description: "عقد اتفاق على أتعاب المحامي مع الموكل",
    content: `بسم الله الرحمن الرحيم

عقد اتفاقية أتعاب محاماة

إنه في يوم _______ الموافق ___/___/_______ م

تحرر هذا العقد بين كل من:

أولاً: [اسم المحامي] المحامي المرخص رقم ________، المنضم إلى نقابة المحامين، ويُشار إليه فيما بعد بـ "المحامي".

ثانياً: [اسم الموكل]، الجنسية: ________، رقم الهوية: ________، ويُشار إليه فيما بعد بـ "الموكل".

اتفق الطرفان على ما يلي:

البند الأول: موضوع التوكيل
يتولى المحامي تمثيل الموكل في القضية رقم ________، المرفوعة أمام ________، المتعلقة بـ ________.

البند الثاني: الأتعاب المتفق عليها
اتفق الطرفان على أتعاب قدرها ________ درهم، تُسدَّد على النحو التالي:
- دفعة أولى عند التوقيع: ________ درهم
- دفعة ثانية عند ________: ________ درهم

البند الثالث: التزامات المحامي
يلتزم المحامي بـ:
1. تمثيل الموكل تمثيلاً قانونياً كاملاً
2. إطلاع الموكل على مستجدات القضية
3. المحافظة على سرية المعلومات

البند الرابع: التزامات الموكل
يلتزم الموكل بـ:
1. سداد الأتعاب في مواعيدها
2. تقديم كافة الوثائق والمعلومات اللازمة
3. عدم التدخل في العمل القانوني

حُرر هذا العقد من نسختين بيد كل طرف نسخة.

توقيع المحامي                    توقيع الموكل
________________                ________________`,
    is_favorite: true
  },
  {
    title: "صحيفة دعوى مدنية",
    category: "صحائف دعوى",
    case_type: "مدني",
    description: "نموذج صحيفة افتتاح دعوى مدنية أمام المحكمة",
    content: `بسم الله الرحمن الرحيم

المحكمة الابتدائية المدنية بـ ________

صحيفة دعوى مدنية

المدعي: [اسم المدعي]، يقيم في: ________، هاتف: ________
بوكالة المحامي: ________

المدعى عليه: [اسم المدعى عليه]، يقيم في: ________

الموضوع: ________

وقائع الدعوى:
أولاً: ________
ثانياً: ________
ثالثاً: ________

الطلبات:
يلتمس المدعي من عدالة المحكمة الموقرة التفضل بالحكم له بما يلي:
1. ________
2. ________
3. إلزام المدعى عليه بالرسوم والمصاريف القضائية وأتعاب المحاماة

وفق الله الجميع لما فيه الخير والصواب

المحامي                    التاريخ: ___/___/_______`,
    is_favorite: false
  },
  {
    title: "وكالة خاصة بالتقاضي",
    category: "توكيلات",
    case_type: "عام",
    description: "نموذج توكيل خاص بالتقاضي أمام المحاكم",
    content: `بسم الله الرحمن الرحيم

وكالة خاصة بالتقاضي

أنا الموقع أدناه: [اسم الموكل]
الجنسية: ________
رقم الهوية/الجواز: ________
العنوان: ________

أُوكِّل وأُفوِّض المحامي: ________
رقم القيد: ________

للقيام بالأعمال التالية نيابة عني:
• المطالبة بكافة حقوقي القانونية لدى جميع المحاكم والجهات القضائية
• رفع الدعاوى والإجابة عليها والدفع بكل دفع قانوني
• التقرير بالطعن في الأحكام بالاستئناف والنقض
• قبض المبالغ واستلام الوثائق والأوراق
• وعموماً القيام بكل ما يراه مناسباً لحفظ حقوقي

وهذه الوكالة خاصة بـ: ________

الموكِّل                    التاريخ: ___/___/_______`,
    is_favorite: true
  },
  {
    title: "إشعار إنهاء عقد عمل",
    category: "إشعارات",
    case_type: "عمالي",
    description: "نموذج إشعار رسمي بإنهاء عقد العمل",
    content: `بسم الله الرحمن الرحيم

إشعار إنهاء علاقة عمل

التاريخ: ___/___/_______

من: شركة ________
إلى: السيد/السيدة: ________
الوظيفة: ________

السلام عليكم ورحمة الله وبركاته،

نُعلمكم بأن العقد الذي يربطكم بالشركة سيتم إنهاؤه اعتباراً من تاريخ ___/___/_______، وذلك للأسباب الآتية:
________

وستلتزم الشركة بصرف مستحقاتكم المالية المترتبة على إنهاء الخدمة وفقاً لأحكام قانون العمل الساري.

المستحقات:
- الراتب المستحق حتى تاريخ الإنهاء
- مكافأة نهاية الخدمة
- بدل الإجازة السنوية المتبقية

يُرجى تسليم كافة مقتنيات الشركة في آخر يوم عمل.

مع التقدير،

المدير التنفيذي / مدير الموارد البشرية
التوقيع: ________________`,
    is_favorite: false
  },
  {
    title: "مذكرة جوابية في دعوى مدنية",
    category: "مذكرات",
    case_type: "مدني",
    description: "نموذج مذكرة جوابية في دعوى مدنية",
    content: `بسم الله الرحمن الرحيم

المحكمة الابتدائية المدنية
قضية رقم: ________    السنة: _______

مذكرة جوابية مقدمة من المدعى عليه

أولاً: خلاصة ادعاءات المدعي
________

ثانياً: الرد على هذه الادعاءات
1. ________
2. ________

ثالثاً: الدفوع القانونية
1. الدفع بعدم الاختصاص: ________
2. الدفع بعدم القبول: ________
3. الدفع الموضوعي: ________

رابعاً: الطلبات
نلتمس من عدالة المحكمة:
1. رفض الدعوى شكلاً لـ ________
2. رفض الدعوى موضوعاً لانعدام الأساس القانوني
3. إلزام المدعي بالمصاريف القضائية وأتعاب المحاماة

المحامي                    التاريخ: ___/___/_______`,
    is_favorite: false
  },
  {
    title: "عقد إيجار تجاري",
    category: "عقود",
    case_type: "عقاري",
    description: "نموذج عقد إيجار للمحلات التجارية",
    content: `بسم الله الرحمن الرحيم

عقد إيجار تجاري

إنه في يوم _______ الموافق ___/___/_______

تحرر هذا العقد بين:
المؤجر: [اسم المؤجر]، رقم الهوية: ________, ويُشار إليه بـ "المؤجر"
المستأجر: [اسم المستأجر]، رقم الهوية: ________, ويُشار إليه بـ "المستأجر"

البند الأول: وصف العين المؤجرة
المحل التجاري الكائن في: ________، المساحة الإجمالية: ________ متر مربع

البند الثاني: مدة الإيجار
تبدأ المدة من ___/___/_______ وتنتهي في ___/___/_______

البند الثالث: الأجرة
الأجرة السنوية: ________ درهم، تُسدَّد:  □ شهرياً  □ ربعياً  □ سنوياً

البند الرابع: الاستخدام
يُستخدم المحل لأغراض: ________ فقط، ولا يجوز تغيير الغرض دون إذن خطي.

البند الخامس: الصيانة
الصيانة البسيطة: على المستأجر. الصيانة الجوهرية: على المؤجر.

البند السادس: إنهاء العقد
لا يُفسخ هذا العقد إلا بإشعار مسبق مدته ________ شهراً.

توقيع المؤجر                    توقيع المستأجر`,
    is_favorite: false
  },
  {
    title: "اتفاقية تسوية ودية",
    category: "اتفاقيات",
    case_type: "مدني",
    description: "نموذج اتفاقية تسوية ودية بين الأطراف",
    content: `بسم الله الرحمن الرحيم

اتفاقية تسوية ودية

بتاريخ ___/___/_______ بمدينة ________

حضر كلٌّ من:
الطرف الأول: [اسم الطرف الأول]
الطرف الثاني: [اسم الطرف الثاني]

بحضور المحامي: ________

وبعد التداول والمباحثات، اتفق الطرفان على تسوية النزاع القائم بينهما بشأن: ________

بنود الاتفاقية:
1. يتعهد الطرف الأول بـ: ________
2. يتعهد الطرف الثاني بـ: ________
3. يتنازل الطرف الأول عن حقه في ________
4. يلتزم الطرفان بعدم اللجوء إلى القضاء بشأن هذا النزاع مستقبلاً

المبلغ المتفق على دفعه (إن وجد): ________ درهم

يُعدّ هذا الاتفاق ملزماً للطرفين من تاريخ التوقيع عليه.

توقيع الطرف الأول          توقيع الطرف الثاني          توقيع المحامي`,
    is_favorite: false
  },
  {
    title: "مراسلة قانونية رسمية",
    category: "مراسلات",
    case_type: "عام",
    description: "نموذج مراسلة قانونية رسمية من المحامي",
    content: `بسم الله الرحمن الرحيم

[اسم المكتب]
المحامي: ________
رقم القيد: ________
التاريخ: ___/___/_______
المرجع: ________

السيد/السيدة: ________
المحترم/ة

السلام عليكم ورحمة الله وبركاته،

تحية طيبة وبعد،

نُخبركم بأننا نمثل موكلنا السيد/السيدة: [اسم الموكل]، وقد كلفونا بتوجيه هذه المراسلة إليكم بشأن: ________

وعليه، نطلب منكم خلال مدة أقصاها ________ من تاريخ استلام هذه المراسلة: ________

وفي حال عدم الاستجابة، فإن موكلنا سيكون مضطراً للجوء إلى الجهات القانونية المختصة للمطالبة بحقوقه.

مع تحفظنا على كافة الحقوق القانونية لموكلنا.

وتقبلوا تحياتنا،

المحامي
________`,
    is_favorite: false
  }
];

export default function LegalTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewTemplate, setViewTemplate] = useState(null);
  const [addingSamples, setAddingSamples] = useState(false);
  const [generateDialog, setGenerateDialog] = useState({ open: false, template: null });

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const data = await base44.entities.LegalTemplate.list("-created_date");
    setTemplates(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editing) {
      await base44.entities.LegalTemplate.update(editing.id, form);
    } else {
      await base44.entities.LegalTemplate.create(form);
    }
    setSaving(false);
    setShowForm(false);
    await loadTemplates();
  };

  const handleEdit = (t) => { setEditing(t); setForm({ ...emptyForm, ...t }); setShowForm(true); };
  const handleCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };

  const handleDelete = async (id) => {
    if (!confirm("حذف هذا النموذج؟")) return;
    await base44.entities.LegalTemplate.delete(id);
    await loadTemplates();
  };

  const toggleFavorite = async (t) => {
    await base44.entities.LegalTemplate.update(t.id, { is_favorite: !t.is_favorite });
    await loadTemplates();
  };

  const copyContent = (content) => {
    navigator.clipboard.writeText(content);
  };

  const printTemplate = (t) => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html dir="rtl">
        <head>
          <title>${t.title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Cairo', Arial; padding: 40px; line-height: 1.8; direction: rtl; }
            h1 { color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 10px; }
            pre { white-space: pre-wrap; font-family: 'Cairo', Arial; font-size: 14px; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>${t.title}</h1>
          <pre>${t.content}</pre>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const addSampleTemplates = async () => {
    setAddingSamples(true);
    await base44.entities.LegalTemplate.bulkCreate(SAMPLE_TEMPLATES);
    await loadTemplates();
    setAddingSamples(false);
  };

  const filtered = templates.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !search || t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    const matchCat = categoryFilter === "الكل" || t.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const favorites = filtered.filter(t => t.is_favorite);
  const others = filtered.filter(t => !t.is_favorite);

  return (
    <div>
      <PageHeader
        title="النماذج القانونية"
        subtitle={`${templates.length} نموذج`}
        action={
          <div className="flex gap-2">
            {templates.length === 0 && (
              <Button variant="outline" onClick={addSampleTemplates} disabled={addingSamples} className="gap-2 text-sm">
                <BookOpen className="h-4 w-4" />
                {addingSamples ? "جارٍ الإضافة..." : "إضافة نماذج افتراضية"}
              </Button>
            )}
            <Button onClick={handleCreate} className="bg-primary text-white gap-2">
              <Plus className="h-4 w-4" /> نموذج جديد
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في النماذج..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["الكل", ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${categoryFilter === cat ? "bg-primary text-white border-primary" : "bg-background border-border hover:border-primary/50"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="لا توجد نماذج"
          description="أضف نماذجك القانونية أو استخدم النماذج الافتراضية"
          action={
            <div className="flex gap-2">
              <Button onClick={handleCreate}>نموذج جديد</Button>
              <Button variant="outline" onClick={addSampleTemplates} disabled={addingSamples}>
                {addingSamples ? "..." : "نماذج افتراضية"}
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Favorites */}
          {favorites.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> المفضلة ({favorites.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map(t => (
                  <TemplateCard key={t.id} template={t} onEdit={handleEdit} onDelete={handleDelete}
                    onToggleFav={toggleFavorite} onCopy={copyContent} onPrint={printTemplate} onView={setViewTemplate}
                    onGenerate={(tmpl) => setGenerateDialog({ open: true, template: tmpl })} />
                ))}
              </div>
            </div>
          )}

          {/* Others */}
          {others.length > 0 && (
            <div>
              {favorites.length > 0 && (
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">جميع النماذج ({others.length})</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {others.map(t => (
                  <TemplateCard key={t.id} template={t} onEdit={handleEdit} onDelete={handleDelete}
                    onToggleFav={toggleFavorite} onCopy={copyContent} onPrint={printTemplate} onView={setViewTemplate}
                    onGenerate={(tmpl) => setGenerateDialog({ open: true, template: tmpl })} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل النموذج" : "إضافة نموذج قانوني جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>عنوان النموذج *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="مثال: عقد اتفاقية أتعاب" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>التصنيف</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>نوع القضية</Label>
                <Select value={form.case_type} onValueChange={v => setForm(f => ({ ...f, case_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CASE_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>وصف مختصر</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف مختصر للنموذج" />
            </div>
            <div className="space-y-1.5">
              <Label>محتوى النموذج *</Label>
              <Textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="اكتب النموذج هنا... استخدم [اسم الموكل] للمتغيرات القابلة للتعديل"
                className="h-64 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">نصيحة: استخدم [اسم الموكل]، [التاريخ]، [المبلغ] كمتغيرات قابلة للتعبئة</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.content} className="bg-primary text-white">
              {saving ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "إضافة النموذج"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Document Dialog */}
      {generateDialog.open && (
        <GenerateDocumentDialog
          open={generateDialog.open}
          onOpenChange={(o) => setGenerateDialog({ open: o, template: null })}
          template={generateDialog.template}
        />
      )}

      {/* View Dialog */}
      <Dialog open={!!viewTemplate} onOpenChange={() => setViewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          {viewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {viewTemplate.title}
                </DialogTitle>
              </DialogHeader>
              <div className="flex gap-2 mb-4">
                <Badge className={CATEGORY_COLORS[viewTemplate.category] || "bg-gray-100"}>
                  {viewTemplate.category}
                </Badge>
                <Badge variant="outline">{viewTemplate.case_type}</Badge>
              </div>
              <div className="bg-muted/30 rounded-xl p-5 font-mono text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto border">
                {viewTemplate.content}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => copyContent(viewTemplate.content)} className="gap-2">
                  <Copy className="h-4 w-4" /> نسخ
                </Button>
                <Button onClick={() => printTemplate(viewTemplate)} className="gap-2 bg-primary text-white">
                  <Download className="h-4 w-4" /> طباعة / تصدير
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateCard({ template: t, onEdit, onDelete, onToggleFav, onCopy, onPrint, onView, onGenerate }) {
  return (
    <Card className="p-4 hover:shadow-lg transition-all hover:-translate-y-0.5 flex flex-col border border-border">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground leading-tight">{t.title}</h3>
          {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>}
        </div>
        <button onClick={() => onToggleFav(t)} className="shrink-0 text-yellow-500 hover:text-yellow-600 transition-colors">
          {t.is_favorite ? <Star className="h-4 w-4 fill-yellow-500" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>
      <div className="flex gap-1.5 mb-3">
        <Badge className={`text-xs ${CATEGORY_COLORS[t.category] || "bg-gray-100"}`}>{t.category}</Badge>
        <Badge variant="outline" className="text-xs">{t.case_type}</Badge>
      </div>
      <div className="bg-muted/40 rounded-lg p-3 mb-3 flex-1 max-h-24 overflow-hidden relative">
        <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-4 font-mono">{t.content}</p>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted/60 to-transparent rounded-b-lg" />
      </div>
      {/* Generate Button */}
      <Button
        variant="default"
        size="sm"
        onClick={() => onGenerate(t)}
        className="mb-2 gap-1 text-xs bg-primary/90 hover:bg-primary w-full"
      >
        <Wand2 className="h-3.5 w-3.5" /> توليد وثيقة بيانات القضية
      </Button>
      <div className="flex gap-1.5 pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={() => onView(t)} className="flex-1 text-xs gap-1">
          <FileText className="h-3 w-3" /> عرض
        </Button>
        <Button variant="outline" size="icon" onClick={() => onCopy(t.content)} className="h-8 w-8">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => onPrint(t)} className="h-8 w-8">
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(t)} className="h-8 w-8">
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(t.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
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
  // ── الحضور والتمثيل القانوني ────────────────────────────────────────────
  {
    title: "وكالة قانونية عامة",
    category: "التمثيل القانوني",
    content: `الوكالة القانونية العامة

بسم الله الرحمن الرحيم

أنا الموقّع أدناه / {{اسم الموكّل}} حامل الهوية رقم {{رقم الهوية}} الصادرة من {{جهة الإصدار}} بتاريخ {{تاريخ الإصدار}}، المقيم في {{عنوان الموكّل}}

أوكّل وأفوّض الأستاذ / {{اسم المحامي}} المحامي المرخّص بموجب الترخيص رقم {{رقم الترخيص}} للمثول نيابةً عني أمام جميع المحاكم والجهات القضائية والحكومية والإدارية في {{الدولة}} بجميع درجاتها ومستوياتها، وذلك في جميع القضايا والدعاوى المدنية والجزائية والعمالية والتجارية والإدارية وسائر القضايا التي يكون فيها الموكّل طرفاً.

وله بمقتضى هذه الوكالة حق اتخاذ جميع الإجراءات القانونية اللازمة وإيداع المذكرات والطعون والاستئنافات والتمييز وتقديم الطلبات وقبول الإعلانات والتنازل عن الحقوق وإبرام التسويات واستلام المبالغ المحكوم بها وتوقيع المحاضر وتمثيلي في جميع الإجراءات المتعلقة بالقضايا المذكورة.

صدر هذا التوكيل بتاريخ {{التاريخ}} في {{المكان}}.

الموكّل: {{اسم الموكّل}}
التوقيع: __________________
`,
  },
  {
    title: "توكيل خاص بقضية محددة",
    category: "التمثيل القانوني",
    content: `التوكيل الخاص

إنه في يوم {{اليوم}} الموافق {{التاريخ}}

أنا / {{اسم الموكّل}}، {{الجنسية}}، رقم الهوية {{رقم الهوية}}

أوكّل وأنيب عني الأستاذ / {{اسم المحامي}}، المحامي المرخّص، للمثول نيابةً عني في القضية رقم {{رقم القضية}} المرفوعة أمام {{اسم المحكمة}} والمنظورة فيها بحقي/ضدي في موضوع {{موضوع القضية}}.

وله صلاحية اتخاذ جميع الإجراءات القانونية اللازمة للفصل في هذه القضية بما في ذلك تقديم الطعون والاستئنافات وإبرام الصلح وقبول الأحكام.

الموكّل: {{اسم الموكّل}}          توقيعه: __________________
`,
  },

  // ── الدعاوى والمذكرات ──────────────────────────────────────────────────
  {
    title: "صحيفة دعوى مدنية",
    category: "دعاوى ومذكرات",
    content: `صحيفة دعوى مدنية

المحكمة الموقّرة / {{اسم المحكمة}}

المدّعي: {{اسم المدّعي}}، {{الجنسية}}، رقم الهوية {{رقم الهوية}}، المقيم في {{عنوان المدّعي}}
بوساطة محاميه الأستاذ / {{اسم المحامي}}

المدّعى عليه: {{اسم المدّعى عليه}}، المقيم/ومقره في {{عنوان المدّعى عليه}}

الموضوع: {{موضوع الدعوى}}

وقائع الدعوى:
أولاً: {{الوقائع}}

الأساس القانوني:
استناداً إلى أحكام {{المواد القانونية}} من {{القانون المعتمد}}

الطلبات:
يلتمس المدّعي من عدالة المحكمة الموقّرة الحكم بما يأتي:
١- {{الطلب الأول}}
٢- {{الطلب الثاني}}
٣- إلزام المدّعى عليه بالمصاريف وأتعاب المحاماة.

المحامي: {{اسم المحامي}}
التاريخ: {{التاريخ}}
`,
  },
  {
    title: "مذكرة دفاع",
    category: "دعاوى ومذكرات",
    content: `مذكرة دفاع

المحكمة الموقّرة / {{اسم المحكمة}}
القضية رقم: {{رقم القضية}}

مقدّمة من: {{اسم المدّعى عليه}} — المدّعى عليه
بوساطة محاميه الأستاذ / {{اسم المحامي}}

في مواجهة: {{اسم المدّعي}} — المدّعي

الدفوع:
أولاً — الدفوع الشكلية:
{{الدفوع الشكلية}}

ثانياً — الدفوع الموضوعية:
{{الدفوع الموضوعية}}

ثالثاً — الطلبات:
يلتمس المدّعى عليه رفض الدعوى وإلزام المدّعي بالمصاريف وأتعاب المحاماة.

المحامي: {{اسم المحامي}}
التاريخ: {{التاريخ}}
`,
  },

  // ── العقود والاتفاقيات ──────────────────────────────────────────────────
  {
    title: "عقد استشارة قانونية",
    category: "عقود",
    content: `عقد تقديم خدمات استشارية قانونية

بين: {{اسم المكتب}} — المستشار القانوني
و  : {{اسم العميل}} — العميل

يتفق الطرفان على ما يأتي:

المادة الأولى — نطاق الخدمات:
يتعهد المستشار القانوني بتقديم الخدمات الاستشارية القانونية في مجال {{مجال الاستشارة}}، وذلك خلال مدة لا تتجاوز {{مدة العقد}}.

المادة الثانية — الأتعاب:
يلتزم العميل بسداد مبلغ {{مبلغ الأتعاب}} {{العملة}} على النحو الآتي:
- {{جدول السداد}}

المادة الثالثة — السرية:
يلتزم المستشار القانوني بالحفاظ على سرية جميع المعلومات والوثائق المتعلقة بالعميل.

المادة الرابعة — إنهاء العقد:
يجوز لأي من الطرفين إنهاء هذا العقد بإشعار خطي مسبق مدته {{فترة الإشعار}} أيام.

المادة الخامسة — تسوية النزاعات:
يُحسم أي نزاع ينشأ عن هذا العقد وفق أحكام قانون {{القانون المعتمد}}.

حُرّر هذا العقد من نسختين أصليتين في {{المكان}} بتاريخ {{التاريخ}}.

المستشار القانوني          العميل
{{اسم المحامي}}            {{اسم العميل}}
__________________          __________________
`,
  },
  {
    title: "اتفاقية تسوية ودية",
    category: "عقود",
    content: `اتفاقية تسوية ودية

الأطراف:
الطرف الأول: {{اسم الطرف الأول}}، رقم الهوية {{رقم الهوية الأول}}
الطرف الثاني: {{اسم الطرف الثاني}}، رقم الهوية {{رقم الهوية الثاني}}

الديباجة:
بما أن الطرفين كانا على خلاف بشأن {{موضوع النزاع}}، وقد اتفقا على تسوية هذا النزاع وديّاً دون اللجوء إلى القضاء،

فقد اتفق الطرفان على ما يأتي:
أولاً: {{بنود الاتفاقية}}
ثانياً: يُقرّ الطرف الأول بأن التزاماته قِبل الطرف الثاني قد أُوفيت كاملةً بموجب هذه الاتفاقية.
ثالثاً: يتنازل كلا الطرفين عن أي دعوى أو مطالبة مستقبلية تتعلق بموضوع النزاع.

الطرف الأول                    الطرف الثاني
التوقيع: __________            التوقيع: __________
التاريخ: {{التاريخ}}
`,
  },

  // ── الإشعارات والإنذارات ────────────────────────────────────────────────
  {
    title: "إنذار قانوني رسمي",
    category: "إنذارات وإشعارات",
    content: `إنذار قانوني رسمي

إلى / السيد {{اسم المُنذَر}}
العنوان / {{عنوان المُنذَر}}

تحية طيبة وبعد،

بالإشارة إلى {{موضوع الإنذار}}، وبتكليف من موكلي السيد / {{اسم الموكّل}}، أتوجه إليكم بهذا الإنذار القانوني الرسمي مُطالباً إياكم بالآتي:

{{طلبات الإنذار}}

وذلك خلال مدة أقصاها {{المهلة}} يوماً من تاريخ استلام هذا الإنذار، وإلا أُضطر إلى اتخاذ الإجراءات القانونية الكفيلة بصون حقوق موكلي أمام الجهات القضائية المختصة، وبما يترتب على ذلك من نفقات ومصاريف تقع على عاتقكم.

والله ولي التوفيق.

المحامي
{{اسم المحامي}}
{{تاريخ الإنذار}}

هذا الإنذار يُسلَّم بموجب: ☐ البريد المسجّل  ☐ الكتروني  ☐ يد إلى يد
`,
  },
  {
    title: "إشعار إنهاء عقد",
    category: "إنذارات وإشعارات",
    content: `إشعار رسمي بإنهاء عقد

التاريخ: {{التاريخ}}

إلى / {{اسم الطرف الآخر}}

الموضوع: إشعار بإنهاء {{نوع العقد}} المبرم بتاريخ {{تاريخ إبرام العقد}}

بالإشارة إلى العقد المبرم بيننا في {{تاريخ العقد}} المتضمّن {{موضوع العقد}}،

يسعدني/يؤسفني إبلاغكم بأننا نعتزم إنهاء العقد المذكور استناداً إلى المادة {{رقم المادة}} منه، وذلك اعتباراً من تاريخ {{تاريخ الإنهاء}}.

يُرجى اتخاذ الإجراءات اللازمة لتصفية الالتزامات المتبادلة قبل التاريخ المذكور.

مع الشكر والتقدير،

{{اسم مُرسِل الإشعار}}
{{توقيعه}}
`,
  },

  // ── العمالة والشركات ────────────────────────────────────────────────────
  {
    title: "شكوى عمالية",
    category: "شؤون عمالية",
    content: `شكوى عمالية

إلى / {{اسم الجهة المختصة}}
الموضوع: شكوى عمالية

اسم العامل: {{اسم العامل}}
الجنسية: {{الجنسية}}
رقم جواز السفر/الهوية: {{رقم الوثيقة}}
جهة العمل: {{اسم صاحب العمل/الشركة}}
المسمى الوظيفي: {{الوظيفة}}
تاريخ بدء الخدمة: {{تاريخ بدء الخدمة}}

موضوع الشكوى:
{{تفاصيل الشكوى}}

الطلبات:
{{طلبات العامل}}

المستندات المرفقة:
☐ عقد العمل   ☐ كشف الراتب   ☐ {{مستند آخر}}

مقدّم الشكوى: {{اسم العامل}}
التوقيع: __________________
التاريخ: {{التاريخ}}
`,
  },
  {
    title: "خطاب براءة ذمة",
    category: "شؤون عمالية",
    content: `خطاب براءة الذمة

التاريخ: {{التاريخ}}

إلى من يهمه الأمر

نُفيد بأن السيد/السيدة / {{اسم الموظف}}
الجنسية: {{الجنسية}}    رقم الهوية: {{رقم الهوية}}

قد عمل/عملت لدى {{اسم الشركة/المؤسسة}} بمسمى وظيفي {{المسمى الوظيفي}} خلال الفترة من {{تاريخ بدء الخدمة}} إلى {{تاريخ انتهاء الخدمة}}.

ونُفيد بأنه/أنها لا تترتب عليه/عليها أي التزامات مالية أو إدارية لصالح الشركة، وأن ذمته/ذمتها مالياً وإدارياً تجاهنا بريئة.

المدير المسؤول: {{اسم المدير}}
التوقيع: __________________   الختم الرسمي
`,
  },

  // ── إفادات وشهادات ─────────────────────────────────────────────────────
  {
    title: "إفادة شاهد",
    category: "إفادات وشهادات",
    content: `إفادة شاهد

أنا الموقّع أدناه:
الاسم: {{اسم الشاهد}}
الجنسية: {{الجنسية}}
رقم الهوية: {{رقم الهوية}}
العنوان: {{العنوان}}
المهنة: {{المهنة}}

أُفيد وأُقرّ بحق ديني ووطني بأنني كنت شاهداً على الواقعة التالية:

{{وصف الواقعة}}

وذلك في تاريخ {{تاريخ الواقعة}} في {{مكان الواقعة}}.

وهذه إفادتي الحقيقية الخالية من أي إكراه أو ضغط، وأنا مسؤول عنها قانونياً.

الشاهد: {{اسم الشاهد}}
التوقيع: __________________
التاريخ: {{التاريخ}}
`,
  },
];

export default function LegalTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
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
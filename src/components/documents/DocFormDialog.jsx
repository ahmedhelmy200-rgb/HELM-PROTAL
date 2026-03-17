import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, ExternalLink, ScanText, Loader2, CheckCircle2 } from "lucide-react";

const DOC_TYPES = ["صحيفة دعوى", "مذكرة", "حكم", "عقد", "توكيل", "شهادة", "مستند رسمي", "أخرى"];
const DOC_STATUSES = ["مسودة", "جاهز", "مقدم", "مرفوض"];
const FOLDERS = ["صحيفة دعوى", "مذكرات", "أحكام", "عقود وتوكيلات", "شهادات", "مستندات رسمية", "أخرى"];

const emptyForm = {
  title: "", case_id: "", case_title: "", case_number: "", client_name: "",
  doc_type: "أخرى", file_url: "", file_url_ref: "", file_name: "", file_type: "", folder: "",
  submission_deadline: "", status: "مسودة", ocr_text: "", ocr_status: "لم يُعالج", notes: ""
};

export default function DocFormDialog({ open, onOpenChange, editing, cases, onSaved }) {
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extractingOcr, setExtractingOcr] = useState(false);

  React.useEffect(() => {
    if (editing) {
      setForm({ ...emptyForm, ...editing, submission_deadline: editing.submission_deadline?.slice(0, 16) || "" });
    } else {
      setForm(emptyForm);
    }
  }, [editing, open]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { preview_url, file_url, storage_ref } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url: preview_url || file_url, file_url_ref: storage_ref || file_url, file_name: file.name, file_type: file.type }));
    setUploading(false);
  };

  const handleExtractOcr = async () => {
    if (!form.file_url) return;
    setExtractingOcr(true);
    setForm(f => ({ ...f, ocr_status: "جارٍ المعالجة" }));
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: form.file_url_ref || form.file_url,
      json_schema: {
        type: "object",
        properties: {
          extracted_text: { type: "string", description: "كل النص المستخرج من المستند" }
        }
      }
    });
    if (result.status === "success" && result.output?.extracted_text) {
      setForm(f => ({ ...f, ocr_text: result.output.extracted_text, ocr_status: "مكتمل" }));
    } else {
      setForm(f => ({ ...f, ocr_status: "فشل" }));
    }
    setExtractingOcr(false);
  };

  const handleCaseSelect = (val) => {
    const c = cases.find(c => c.title === val);
    if (c) setForm(f => ({ ...f, case_id: c.id, case_title: c.title, case_number: c.case_number || "", client_name: c.client_name }));
    else setForm(f => ({ ...f, case_title: val, case_id: "" }));
  };

  const handleSave = async () => {
    setSaving(true);
    if (editing) await base44.entities.Document.update(editing.id, form);
    else await base44.entities.Document.create(form);
    setSaving(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editing ? "تعديل المستند" : "إضافة مستند جديد"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="space-y-1 col-span-2"><Label>اسم المستند *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>

          <div className="space-y-1"><Label>نوع المستند</Label>
            <Select value={form.doc_type} onValueChange={v => setForm({ ...form, doc_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>الحالة</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1 col-span-2"><Label>القضية المرتبطة</Label>
            <Input list="cases-docs-form" value={form.case_title} onChange={e => handleCaseSelect(e.target.value)} placeholder="اختياري - ابحث أو اختر" />
            <datalist id="cases-docs-form">{cases.map(c => <option key={c.id} value={c.title} />)}</datalist>
          </div>

          <div className="space-y-1 col-span-2"><Label>المجلد الافتراضي</Label>
            <Select value={form.folder || ""} onValueChange={v => setForm({ ...form, folder: v })}>
              <SelectTrigger><SelectValue placeholder="اختر مجلداً (اختياري)" /></SelectTrigger>
              <SelectContent>
                {FOLDERS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 col-span-2"><Label>موعد التقديم</Label>
            <Input type="datetime-local" value={form.submission_deadline} onChange={e => setForm({ ...form, submission_deadline: e.target.value })} />
          </div>

          <div className="space-y-2 col-span-2">
            <Label>رفع ملف</Label>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border border-dashed border-border hover:border-primary transition-colors text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                {uploading ? "جارٍ الرفع..." : form.file_name || "اختر ملفاً"}
                <input type="file" onChange={handleUpload} className="hidden" accept="image/*,.pdf" disabled={uploading} />
              </label>
              {form.file_url && (
                <>
                  <a href={form.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />عرض
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={handleExtractOcr}
                    disabled={extractingOcr}
                  >
                    {extractingOcr ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanText className="h-3.5 w-3.5" />}
                    استخراج نص (OCR)
                  </Button>
                  {form.ocr_status === "مكتمل" && <Badge className="bg-success/10 text-success border-success/30 text-xs"><CheckCircle2 className="h-3 w-3 ml-1" />OCR مكتمل</Badge>}
                </>
              )}
            </div>
            {form.ocr_text && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed max-h-28 overflow-y-auto border border-border">
                <p className="font-medium text-foreground mb-1 flex items-center gap-1"><ScanText className="h-3.5 w-3.5" />النص المستخرج:</p>
                {form.ocr_text.slice(0, 400)}{form.ocr_text.length > 400 ? "..." : ""}
              </div>
            )}
          </div>

          <div className="space-y-1 col-span-2"><Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="h-16" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving || !form.title} className="bg-primary text-white">
            {saving ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "إضافة المستند"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

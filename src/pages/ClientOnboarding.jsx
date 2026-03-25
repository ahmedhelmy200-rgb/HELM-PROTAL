import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileUp, LogOut, ShieldCheck } from "lucide-react";

const emptyForm = {
  full_name: "",
  client_type: "فرد",
  id_number: "",
  phone: "",
  address: "",
  nationality: "",
  notes: "",
  status: "قيد المراجعة",
};

export default function ClientOnboarding() {
  const { user, checkAppState, logout } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user?.role === "client") {
      setForm((prev) => ({
        ...prev,
        full_name: user.client_name || user.full_name || prev.full_name,
      }));
      setMessage({ type: "success", text: "تم ربط حسابك كموكّل. يمكنك الآن استخدام البوابة." });
      return;
    }
    setForm((prev) => ({
      ...prev,
      full_name: user?.full_name && user.full_name !== user.email ? user.full_name : prev.full_name,
    }));
  }, [user]);

  const canSubmit = useMemo(() => !!form.full_name && !!form.phone && !!user?.email, [form.full_name, form.phone, user?.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await base44.auth.registerClientProfile(form, attachments);
      await checkAppState();
      setMessage({ type: "success", text: "تم حفظ بياناتك وربط الحساب كبوابة موكّل بنجاح." });
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "تعذّر إكمال التسجيل." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-6 items-start">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-2xl">تسجيل موكّل جديد</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">سجّل بياناتك بنفس بريد Google الحالي، ثم ارفع المستندات التعريفية الخاصة بك. لن تتمكن من دخول بقية النظام قبل إكمال هذه الخطوة.</p>
                </div>
                <Badge variant="secondary" className="text-sm">{user?.email || ""}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>الاسم الكامل *</Label>
                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>نوع الموكّل</Label>
                    <Select value={form.client_type} onValueChange={(value) => setForm({ ...form, client_type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="فرد">فرد</SelectItem>
                        <SelectItem value="شركة">شركة</SelectItem>
                        <SelectItem value="مؤسسة">مؤسسة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>رقم الهاتف *</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>رقم الهوية / السجل</Label>
                    <Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الجنسية</Label>
                    <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>العنوان</Label>
                    <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>ملاحظات إضافية</Label>
                    <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>مستنداتك التعريفية</Label>
                    <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 cursor-pointer hover:border-primary/40 transition-colors">
                      <FileUp className="h-6 w-6 text-primary" />
                      <div className="text-center">
                        <p className="font-medium">اختر ملفات PDF أو صور</p>
                        <p className="text-xs text-muted-foreground mt-1">يمكنك رفع أكثر من ملف وسيتم ربطها بحسابك مباشرة</p>
                      </div>
                      <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => setAttachments(Array.from(e.target.files || []))} />
                    </label>
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((file) => (
                          <div key={`${file.name}-${file.size}`} className="rounded-lg border bg-background px-3 py-2 text-sm flex items-center justify-between gap-2">
                            <span className="truncate">{file.name}</span>
                            <Badge variant="outline">{Math.max(1, Math.round(file.size / 1024))} KB</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {message && (
                  <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => logout(false)} className="gap-2">
                    <LogOut className="h-4 w-4" />تسجيل خروج
                  </Button>
                  <Button type="submit" disabled={!canSubmit || submitting} className="bg-primary text-white min-w-40">
                    {submitting ? "جارٍ حفظ البيانات..." : "حفظ وربط الحساب"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />كيف يعمل الوصول؟</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 leading-7">
                <p>الدخول عبر Google مسموح، لكن الحساب غير المرتبط لا يصل إلى أي قضية أو فاتورة أو مستند إلا بعد تسجيل نفسه كموكّل بنفس البريد.</p>
                <p>بعد الحفظ، سيتم ربط البريد بسجل موكّل واحد فقط، وتصبح رؤيتك محصورة في بياناتك ومستنداتك أنت.</p>
                <p>الرفع من هذه الصفحة يضيف مستنداتك إلى ملفك مباشرة حتى يراجعها المكتب داخل النظام.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
                <div className="flex items-center gap-2 text-foreground font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-600" />المطلوب الآن</div>
                <p>أدخل اسمك الكامل ورقم هاتفك.</p>
                <p>استخدم نفس بريد Google الظاهر أعلى الصفحة.</p>
                <p>ارفع الهوية أو السجل أو أي مرفقات تعريفية لازمة.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

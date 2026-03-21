import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2, Phone, Mail, Globe, MapPin, CreditCard, Palette,
  Upload, Save, CheckCircle, Image, Stamp, PenTool, FileText,
  Clock, Link2, Download, Database, Shield, Wifi,
  RefreshCw, HardDrive, Cloud, AlertCircle,
  Printer, Hash, Banknote, Users, Briefcase, UploadCloud, Type
} from "lucide-react";
import PageHeader from "../components/helm/PageHeader";
import { applyVisualIdentity } from "@/lib/theme";
import { collectBackupData, downloadLocalBackup, uploadBackupToCloud, restoreBackupFromCloud, restoreBackupData, readBackupFile } from "@/lib/backup";
import { useAuth } from "@/lib/AuthContext";
import { appParams } from "@/lib/app-params";

// Reusable field component
const Field = ({ label, icon, children }) => {
  const FIcon = icon;
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {FIcon && <FIcon className="h-3.5 w-3.5 text-muted-foreground" />}
        {label}
      </Label>
      {children}
    </div>
  );
};

// Upload button component
const UploadArea = ({ label, value, onUpload, uploading, accept = "image/*" }) => (
  <div className="border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-primary/50 transition-colors bg-muted/30">
    {value ? (
      <div className="flex flex-col items-center gap-3">
        <img src={value} alt={label} className="max-h-24 max-w-full object-contain rounded-lg shadow" />
        <Button variant="outline" size="sm" onClick={onUpload} disabled={uploading} className="gap-2 text-xs">
          <Upload className="h-3.5 w-3.5" /> تغيير {label}
        </Button>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-3 py-3">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Image className="h-6 w-6 text-primary/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">PNG، JPG بحد أقصى 5 ميجابايت</p>
        </div>
        <Button variant="outline" size="sm" onClick={onUpload} disabled={uploading} className="gap-2 text-xs">
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "جارٍ الرفع..." : "رفع " + label}
        </Button>
      </div>
    )}
  </div>
);

const SPECIALIZATIONS = ["مدني", "جزائي", "تجاري", "عمالي", "أسري", "إداري", "عقاري", "ملكية فكرية", "تحكيم دولي", "قانون شركات"];

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, stamp: false, signature: false });
  const [activeTab, setActiveTab] = useState("office");
  const [backupStatus, setBackupStatus] = useState(null);
  const [exportingData, setExportingData] = useState(false);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudRestoreBusy, setCloudRestoreBusy] = useState(false);
  const [cloudStatus, setCloudStatus] = useState(null);

  const defaultSettings = {
    office_name: "مكتب المستشار أحمد حلمي",
    office_name_en: "Ahmed Helmy Law Office",
    lawyer_name: "المستشار أحمد حلمي",
    license_number: "", phone: "", phone2: "", email: "", website: "", address: "", city: "",
    country: "الإمارات العربية المتحدة",
    logo_url: "", logo_url_ref: "", stamp_url: "", stamp_url_ref: "", signature_url: "", signature_url_ref: "",
    invoice_header_text: "مكتب المستشار أحمد حلمي للمحاماة والاستشارات القانونية",
    invoice_footer_text: "شكراً لثقتكم بمكتبنا - نسعى دائماً لتقديم أفضل خدمة قانونية",
    invoice_notes_default: "",
    bank_name: "", bank_account: "", iban: "", vat_number: "",
    primary_color: "#1d4ed8", secondary_color: "#f59e0b", sidebar_color: "#1d4ed8",
    app_font: "Cairo", currency: "د.إ",
    specializations: [], working_hours: "من 8 صباحاً إلى 5 مساءً",
    social_twitter: "", social_linkedin: "", social_whatsapp: ""
  };

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const data = await base44.entities.OfficeSettings.list();
    if (data.length > 0) {
      const merged = { ...defaultSettings, ...data[0] };
      setSettings(merged);
      setSettingsId(data[0].id);
      applyTheme(merged);
    } else {
      setSettings(defaultSettings);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    if (settingsId) {
      await base44.entities.OfficeSettings.update(settingsId, { ...settings, logo_url: settings.logo_url_ref || settings.logo_url, stamp_url: settings.stamp_url_ref || settings.stamp_url, signature_url: settings.signature_url_ref || settings.signature_url });
    } else {
      const created = await base44.entities.OfficeSettings.create({ ...settings, logo_url: settings.logo_url_ref || settings.logo_url, stamp_url: settings.stamp_url_ref || settings.stamp_url, signature_url: settings.signature_url_ref || settings.signature_url });
      setSettingsId(created.id);
    }
    setSaving(false);
    setSaved(true);
    applyTheme(settings);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleUpload = async (field) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const localPreview = URL.createObjectURL(file);
      setUploading(u => ({ ...u, [field]: true }));
      try {
        const { preview_url, file_url, storage_ref } = await base44.integrations.Core.UploadFile({
          file,
          bucket: appParams.brandBucket,
          folder: `brand-assets/${field}`,
        });
        setSettings(s => ({
          ...s,
          [`${field}_url`]: localPreview || preview_url || file_url,
          [`${field}_url_ref`]: storage_ref || file_url,
        }));
      } catch (error) {
        URL.revokeObjectURL(localPreview);
        throw error;
      } finally {
        setUploading(u => ({ ...u, [field]: false }));
      }
    };
    input.click();
  };

  const toggleSpecialization = (spec) => {
    const current = settings.specializations || [];
    const updated = current.includes(spec) ? current.filter(s => s !== spec) : [...current, spec];
    setSettings(s => ({ ...s, specializations: updated }));
  };

  // Apply theme to the app CSS variables
  const applyTheme = (s) => {
    const themeClass = document.documentElement.classList.contains("theme-light") ? "light" : "dark";
    applyVisualIdentity(s, themeClass);
  };

  useEffect(() => {
    if (settings) applyTheme(settings);
  }, [settings?.primary_color, settings?.secondary_color, settings?.sidebar_color, settings?.app_font]);


// Restore backup from JSON file
const [restoring, setRestoring] = useState(false);
const [restoreStatus, setRestoreStatus] = useState(null);

const handleRestoreBackup = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    setRestoreStatus(null);
    try {
      const backup = await readBackupFile(file);
      const result = await restoreBackupData(backup);
      base44.__clearCache?.();
      setRestoreStatus({ type: result.failures?.length ? "warning" : "success", msg: result.msg });
      await loadSettings();
    } catch (error) {
      setRestoreStatus({ type: "error", msg: error?.message || "تعذّر استيراد الملف" });
    } finally {
      setRestoring(false);
      setTimeout(() => setRestoreStatus(null), 8000);
    }
  };
  input.click();
};

const handleCloudBackup = async () => {
  setCloudBusy(true);
  setCloudStatus(null);
  try {
    const backup = await uploadBackupToCloud(base44);
    setCloudStatus({ type: "success", msg: `تم رفع النسخة السحابية بنجاح (${backup.cases?.length || 0} قضية، ${backup.clients?.length || 0} موكل)` });
  } catch (error) {
    setCloudStatus({ type: "error", msg: error?.message || "فشل رفع النسخة السحابية" });
  } finally {
    setCloudBusy(false);
    setTimeout(() => setCloudStatus(null), 6000);
  }
};

const handleCloudRestore = async () => {
  setCloudRestoreBusy(true);
  setCloudStatus(null);
  try {
    const backup = await restoreBackupFromCloud();
    const result = await restoreBackupData(backup);
    setCloudStatus({ type: result.failures?.length ? "warning" : "success", msg: result.msg });
    await loadSettings();
  } catch (error) {
    setCloudStatus({ type: "error", msg: error?.message || "فشل استرجاع النسخة السحابية" });
  } finally {
    setCloudRestoreBusy(false);
    setTimeout(() => setCloudStatus(null), 8000);
  }
};

const exportAllData = async () => {
  setExportingData(true);
  try {
    const backup = await downloadLocalBackup(base44);
    setBackupStatus({ type: "success", msg: `تم تصدير البيانات بنجاح! (${backup.cases?.length || 0} قضية، ${backup.clients?.length || 0} موكل)` });
  } catch (error) {
    setBackupStatus({ type: "error", msg: error?.message || "فشل تصدير النسخة الاحتياطية" });
  } finally {
    setExportingData(false);
    setTimeout(() => setBackupStatus(null), 5000);
  }
};

  if (user?.role === "client" || user?.role === "pending_client") return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6 border-destructive/20 bg-destructive/5">
        <CardHeader className="px-0 pt-0">
          <CardTitle>هذه الصفحة متاحة للإدارة فقط</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0 text-sm text-muted-foreground">
          إعدادات المكتب والنسخ الاحتياطية والصلاحيات غير متاحة داخل بوابة الموكّل.
        </CardContent>
      </Card>
    </div>
  );

  if (!settings) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  return (
    <div>
      <PageHeader
        title="الإعدادات الشاملة"
        subtitle="إدارة بيانات المكتب والتخصيص والتكاملات"
        action={
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-white gap-2">
            {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "جارٍ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6 h-auto gap-1 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="office" className="gap-1.5 text-xs py-2">
            <Building2 className="h-3.5 w-3.5" /> بيانات المكتب
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5 text-xs py-2">
            <Image className="h-3.5 w-3.5" /> الهوية البصرية
          </TabsTrigger>
          <TabsTrigger value="invoice" className="gap-1.5 text-xs py-2">
            <FileText className="h-3.5 w-3.5" /> إعدادات الفواتير
          </TabsTrigger>
          <TabsTrigger value="banking" className="gap-1.5 text-xs py-2">
            <Banknote className="h-3.5 w-3.5" /> بيانات بنكية
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-1.5 text-xs py-2">
            <Database className="h-3.5 w-3.5" /> التخزين والنسخ
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5 text-xs py-2">
            <Link2 className="h-3.5 w-3.5" /> التكاملات
          </TabsTrigger>
        </TabsList>

        {/* ========== بيانات المكتب ========== */}
        <TabsContent value="office">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> معلومات المكتب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="اسم المكتب بالعربية" icon={Building2}>
                    <Input value={settings.office_name} onChange={e => set("office_name", e.target.value)} placeholder="مكتب المحامي أحمد للمحاماة" />
                  </Field>
                  <Field label="اسم المكتب بالإنجليزية" icon={Building2}>
                    <Input value={settings.office_name_en} onChange={e => set("office_name_en", e.target.value)} placeholder="Law Office" />
                  </Field>
                </div>
                <Field label="اسم المحامي المسؤول" icon={Users}>
                  <Input value={settings.lawyer_name} onChange={e => set("lawyer_name", e.target.value)} placeholder="المحامي أحمد محمد" />
                </Field>
                <Field label="رقم الترخيص / القيد في نقابة المحامين" icon={Hash}>
                  <Input value={settings.license_number} onChange={e => set("license_number", e.target.value)} placeholder="12345" />
                </Field>
                <Field label="الرقم الضريبي (TRN)" icon={Hash}>
                  <Input value={settings.vat_number} onChange={e => set("vat_number", e.target.value)} placeholder="100123456700003" />
                </Field>
                <Field label="ساعات العمل" icon={Clock}>
                  <Input value={settings.working_hours} onChange={e => set("working_hours", e.target.value)} placeholder="من 8 صباحاً إلى 5 مساءً - السبت إلى الخميس" />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" /> بيانات التواصل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="رقم الهاتف الرئيسي" icon={Phone}>
                    <Input value={settings.phone} onChange={e => set("phone", e.target.value)} placeholder="+971 4 XXX XXXX" />
                  </Field>
                  <Field label="رقم هاتف إضافي" icon={Phone}>
                    <Input value={settings.phone2} onChange={e => set("phone2", e.target.value)} placeholder="+971 50 XXX XXXX" />
                  </Field>
                </div>
                <Field label="البريد الإلكتروني" icon={Mail}>
                  <Input type="email" value={settings.email} onChange={e => set("email", e.target.value)} placeholder="info@office.com" />
                </Field>
                <Field label="الموقع الإلكتروني" icon={Globe}>
                  <Input value={settings.website} onChange={e => set("website", e.target.value)} placeholder="https://www.office.com" />
                </Field>
                <Field label="العنوان الكامل" icon={MapPin}>
                  <Textarea value={settings.address} onChange={e => set("address", e.target.value)} placeholder="شارع الشيخ زايد، برج الإمارات، الطابق 12، مكتب 1205" className="h-16" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="المدينة" icon={MapPin}>
                    <Input value={settings.city} onChange={e => set("city", e.target.value)} placeholder="دبي" />
                  </Field>
                  <Field label="الدولة">
                    <Input value={settings.country} onChange={e => set("country", e.target.value)} placeholder="الإمارات العربية المتحدة" />
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" /> تخصصات المكتب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(spec => {
                    const active = (settings.specializations || []).includes(spec);
                    return (
                      <button
                        key={spec}
                        onClick={() => toggleSpecialization(spec)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${active ? "bg-primary text-white border-primary" : "bg-background text-foreground border-border hover:border-primary/50"}`}
                      >
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" /> حسابات التواصل الاجتماعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="حساب تويتر / X">
                    <Input value={settings.social_twitter} onChange={e => set("social_twitter", e.target.value)} placeholder="@username" />
                  </Field>
                  <Field label="لينكد إن">
                    <Input value={settings.social_linkedin} onChange={e => set("social_linkedin", e.target.value)} placeholder="linkedin.com/in/..." />
                  </Field>
                  <Field label="واتساب">
                    <Input value={settings.social_whatsapp} onChange={e => set("social_whatsapp", e.target.value)} placeholder="+971 50 XXX XXXX" />
                  </Field>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== الهوية البصرية ========== */}
        <TabsContent value="branding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="h-4 w-4 text-primary" /> شعار المكتب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UploadArea
                  label="الشعار"
                  value={settings.logo_url}
                  onUpload={() => handleUpload("logo")}
                  uploading={uploading.logo}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">سيظهر الشعار في الفواتير والتقارير الرسمية</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stamp className="h-4 w-4 text-primary" /> الختم الرسمي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UploadArea
                  label="الختم الرسمي"
                  value={settings.stamp_url}
                  onUpload={() => handleUpload("stamp")}
                  uploading={uploading.stamp}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">يُستخدم الختم في أسفل الفواتير والوثائق الرسمية</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-primary" /> التوقيع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UploadArea
                  label="التوقيع"
                  value={settings.signature_url}
                  onUpload={() => handleUpload("signature")}
                  uploading={uploading.signature}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">يُستخدم التوقيع في الوثائق الرسمية والعقود</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" /> ألوان وعملة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="اللون الرئيسي (Sidebar + أزرار)" icon={Palette}>
                  <div className="flex items-center gap-3">
                    <input type="color" value={settings.primary_color || "#1d4ed8"} onChange={e => set("primary_color", e.target.value)} className="h-10 w-16 rounded cursor-pointer border border-border" />
                    <Input value={settings.primary_color || "#1d4ed8"} onChange={e => set("primary_color", e.target.value)} placeholder="#1d4ed8" className="font-mono" />
                    <div className="flex gap-1.5 flex-wrap">
                      {["#1d4ed8","#0f766e","#7c3aed","#b91c1c","#0369a1","#1e293b","#059669"].map(c => (
                        <button key={c} onClick={() => set("primary_color", c)} className="h-7 w-7 rounded-full border-2 transition-all" style={{ background: c, borderColor: settings.primary_color === c ? "#000" : "transparent" }} title={c} />
                      ))}
                    </div>
                  </div>
                </Field>
                <Field label="اللون الثانوي / التمييز (Accent)" icon={Palette}>
                  <div className="flex items-center gap-3">
                    <input type="color" value={settings.secondary_color || "#f59e0b"} onChange={e => set("secondary_color", e.target.value)} className="h-10 w-16 rounded cursor-pointer border border-border" />
                    <Input value={settings.secondary_color || "#f59e0b"} onChange={e => set("secondary_color", e.target.value)} placeholder="#f59e0b" className="font-mono" />
                    <div className="flex gap-1.5 flex-wrap">
                      {["#f59e0b","#ef4444","#10b981","#8b5cf6","#ec4899","#f97316","#06b6d4"].map(c => (
                        <button key={c} onClick={() => set("secondary_color", c)} className="h-7 w-7 rounded-full border-2 transition-all" style={{ background: c, borderColor: settings.secondary_color === c ? "#000" : "transparent" }} title={c} />
                      ))}
                    </div>
                  </div>
                </Field>
                <Field label="لون الشريط الجانبي" icon={Palette}>
                  <div className="flex items-center gap-3">
                    <input type="color" value={settings.sidebar_color || "#06142c"} onChange={e => set("sidebar_color", e.target.value)} className="h-10 w-16 rounded cursor-pointer border border-border" />
                    <Input value={settings.sidebar_color || "#06142c"} onChange={e => set("sidebar_color", e.target.value)} placeholder="#06142c" className="font-mono" />
                    <div className="flex gap-1.5 flex-wrap">
                      {["#06142c","#0f2f63","#0f766e","#1f2937","#312e81","#3f0d5c"].map(c => (
                        <button key={c} onClick={() => set("sidebar_color", c)} className="h-7 w-7 rounded-full border-2 transition-all" style={{ background: c, borderColor: settings.sidebar_color === c ? "#000" : "transparent" }} title={c} />
                      ))}
                    </div>
                  </div>
                </Field>
                <Field label="خط التطبيق" icon={Type}>
                  <div className="flex gap-2 flex-wrap">
                    {["Cairo","Tajawal","Amiri","IBM Plex Sans Arabic","Noto Sans Arabic","Readex Pro","El Messiri","Changa","Almarai"].map(font => (
                      <button key={font} onClick={() => set("app_font", font)}
                        className={`px-3 py-2 rounded-lg text-sm border transition-all ${settings.app_font === font ? "bg-primary text-white border-primary" : "bg-background border-border hover:border-primary/50"}`}
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">الخط والألوان تُطبَّق فورياً داخل الواجهة أثناء الاختيار ثم تُحفَظ نهائياً عند الضغط على حفظ.</p>
                </Field>

                {/* Live Preview */}
                <div className="p-4 rounded-xl border-2 transition-all" style={{ borderColor: settings.primary_color || "#1d4ed8", background: `${settings.primary_color || "#1d4ed8"}08` }}>
                  <p className="text-xs text-muted-foreground mb-3 font-medium">معاينة مباشرة للهوية البصرية</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0" style={{ background: settings.primary_color || "#1d4ed8" }}>
                      {settings.logo_url ? <img src={settings.logo_url} alt="logo" className="h-full w-full object-contain rounded-xl" /> : (settings.office_name || "م")[0]}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: settings.primary_color || "#1d4ed8", fontFamily: settings.app_font || "Cairo" }}>{settings.office_name || "اسم المكتب"}</p>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: settings.app_font || "Cairo" }}>{settings.lawyer_name || "اسم المحامي"}</p>
                    </div>
                    <div className="mr-auto">
                      <span className="px-3 py-1 rounded-full text-xs text-white font-bold" style={{ background: settings.secondary_color || "#f59e0b" }}>لون مميز</span>
                    </div>
                  </div>
                </div>

                <Field label="العملة الافتراضية" icon={CreditCard}>
                  <div className="flex gap-2 flex-wrap">
                    {["د.إ", "ريال", "$", "€", "£", "ر.س"].map(cur => (
                      <button
                        key={cur}
                        onClick={() => set("currency", cur)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${settings.currency === cur ? "bg-primary text-white border-primary" : "bg-background border-border hover:border-primary/50"}`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Preview */}
                <div className="mt-4 p-4 rounded-xl border-2" style={{ borderColor: settings.primary_color || "#1d4ed8", background: `${settings.primary_color || "#1d4ed8"}08` }}>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">معاينة الهوية البصرية</p>
                  <div className="flex items-center gap-3">
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="logo" className="h-12 w-12 object-contain rounded" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ background: settings.primary_color || "#1d4ed8" }}>
                        {(settings.office_name || "م")[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-bold" style={{ color: settings.primary_color || "#1d4ed8" }}>{settings.office_name || "اسم المكتب"}</p>
                      <p className="text-xs text-muted-foreground">{settings.lawyer_name || "اسم المحامي"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== إعدادات الفواتير ========== */}
        <TabsContent value="invoice">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Printer className="h-4 w-4 text-primary" /> رأس وذيل الفاتورة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="نص رأس الفاتورة (Header)" icon={FileText}>
                  <Textarea
                    value={settings.invoice_header_text}
                    onChange={e => set("invoice_header_text", e.target.value)}
                    placeholder="مكتب [اسم المكتب] للمحاماة والاستشارات القانونية&#10;مرخص من وزارة العدل - رقم الترخيص: XXXXX"
                    className="h-24"
                  />
                </Field>
                <Field label="نص ذيل الفاتورة (Footer)" icon={FileText}>
                  <Textarea
                    value={settings.invoice_footer_text}
                    onChange={e => set("invoice_footer_text", e.target.value)}
                    placeholder="شكراً لثقتكم بمكتبنا - جميع الأتعاب غير قابلة للاسترداد بعد بدء الخدمة"
                    className="h-20"
                  />
                </Field>
                <Field label="ملاحظات افتراضية تظهر في كل فاتورة">
                  <Textarea
                    value={settings.invoice_notes_default}
                    onChange={e => set("invoice_notes_default", e.target.value)}
                    placeholder="يُرجى الدفع خلال 15 يوم من تاريخ الإصدار..."
                    className="h-20"
                  />
                </Field>
              </CardContent>
            </Card>

            {/* معاينة هيدر الفاتورة */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> معاينة رأس الفاتورة الرسمية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div dir="rtl" className="border-2 rounded-xl p-6 bg-white shadow-inner" style={{ borderColor: settings.primary_color || "#1d4ed8" }}>
                  {/* Header Preview */}
                  <div className="flex justify-between items-start pb-4 mb-4" style={{ borderBottom: `3px solid ${settings.primary_color || "#1d4ed8"}` }}>
                    <div className="flex items-start gap-4">
                      {settings.logo_url ? (
                        <img src={settings.logo_url} alt="logo" className="h-16 w-16 object-contain" />
                      ) : (
                        <div className="h-16 w-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl" style={{ background: settings.primary_color || "#1d4ed8" }}>
                          {(settings.office_name || "م")[0]}
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-bold" style={{ color: settings.primary_color || "#1d4ed8" }}>{settings.office_name || "اسم المكتب"}</h2>
                        {settings.office_name_en && <p className="text-sm text-gray-500">{settings.office_name_en}</p>}
                        {settings.lawyer_name && <p className="text-sm text-gray-600">{settings.lawyer_name}</p>}
                        {settings.license_number && <p className="text-xs text-gray-400">رقم القيد: {settings.license_number}</p>}
                      </div>
                    </div>
                    <div className="text-left text-sm text-gray-500 space-y-0.5">
                      {settings.phone && <p>📞 {settings.phone}</p>}
                      {settings.email && <p>📧 {settings.email}</p>}
                      {settings.address && <p>📍 {settings.address}</p>}
                    </div>
                  </div>
                  {settings.invoice_header_text && (
                    <p className="text-xs text-center text-gray-500 bg-gray-50 p-2 rounded">{settings.invoice_header_text}</p>
                  )}
                  {/* Footer Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    {settings.invoice_footer_text && <p className="text-xs text-gray-400 flex-1">{settings.invoice_footer_text}</p>}
                    <div className="flex items-center gap-4 mr-4">
                      {settings.stamp_url && <img src={settings.stamp_url} alt="stamp" className="max-h-16 max-w-[6rem] object-contain opacity-85" />}
                      {settings.signature_url && <img src={settings.signature_url} alt="sig" className="max-h-12 max-w-[8rem] object-contain" />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== البيانات البنكية ========== */}
        <TabsContent value="banking">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-primary" /> معلومات الحساب البنكي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="اسم البنك" icon={Banknote}>
                    <Input value={settings.bank_name} onChange={e => set("bank_name", e.target.value)} placeholder="بنك أبوظبي الأول" />
                  </Field>
                  <Field label="رقم الحساب" icon={Hash}>
                    <Input value={settings.bank_account} onChange={e => set("bank_account", e.target.value)} placeholder="0123456789" />
                  </Field>
                  <Field label="رقم IBAN" icon={CreditCard}>
                    <Input value={settings.iban} onChange={e => set("iban", e.target.value)} placeholder="AE070331234567890123456" className="font-mono text-sm" />
                  </Field>
                </div>

                {/* Preview Bank Info */}
                {(settings.bank_name || settings.bank_account || settings.iban) && (
                  <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-xs font-semibold text-primary mb-3">كيف ستظهر في الفاتورة:</p>
                    <div className="space-y-1.5 text-sm">
                      {settings.bank_name && <p><span className="text-muted-foreground ml-2">البنك:</span><span className="font-medium">{settings.bank_name}</span></p>}
                      {settings.bank_account && <p><span className="text-muted-foreground ml-2">الحساب:</span><span className="font-mono font-medium">{settings.bank_account}</span></p>}
                      {settings.iban && <p><span className="text-muted-foreground ml-2">IBAN:</span><span className="font-mono font-medium">{settings.iban}</span></p>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== التخزين والنسخ الاحتياطي ========== */}
        <TabsContent value="backup">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-primary" /> التخزين السحابي وحالة النظام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "التخزين السحابي", status: "نشط", icon: Cloud, color: "green" },
                    { label: "المزامنة الفورية", status: "مفعل", icon: Wifi, color: "green" },
                    { label: "تشفير البيانات", status: "SSL/TLS", icon: Shield, color: "green" },
                    { label: "آخر مزامنة", status: "الآن", icon: RefreshCw, color: "blue" },
                  ].map((item, i) => (
                    <div key={i} className={`p-4 rounded-xl border-2 ${item.color === "green" ? "border-green-100 bg-green-50" : "border-blue-100 bg-blue-50"}`}>
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${item.color === "green" ? "bg-green-100" : "bg-blue-100"}`}>
                        <item.icon className={`h-5 w-5 ${item.color === "green" ? "text-green-600" : "text-blue-600"}`} />
                      </div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`text-sm font-bold mt-0.5 ${item.color === "green" ? "text-green-700" : "text-blue-700"}`}>{item.status}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>


<Card className="lg:col-span-2 border-sky-200 bg-sky-50/60 dark:bg-sky-950/20 dark:border-sky-900">
  <CardHeader className="pb-3">
    <CardTitle className="text-base flex items-center gap-2">
      <Cloud className="h-4 w-4 text-sky-600" /> النسخ الاحتياطي السحابي
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-100/60 dark:bg-sky-950/30 text-sm">
      <p className="font-medium text-sky-800 dark:text-sky-200 mb-1">رفع واسترجاع النسخة من السحابة</p>
      <p className="text-sky-700 dark:text-sky-300 text-xs leading-relaxed">
        سيتم حفظ ملف النسخة الاحتياطية في Supabase Storage داخل bucket باسم backups وربطه بحسابك الحالي.
      </p>
    </div>

    {cloudStatus && (
      <div className={`p-3 rounded-lg flex items-center gap-2 text-sm border ${cloudStatus.type === "success" ? "bg-green-50 text-green-700 border-green-200" : cloudStatus.type === "warning" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>
        <AlertCircle className="h-4 w-4 shrink-0" />
        {cloudStatus.msg}
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Button onClick={handleCloudBackup} disabled={cloudBusy} className="gap-2">
        <Cloud className="h-4 w-4" />
        {cloudBusy ? "جارٍ رفع النسخة..." : "رفع نسخة إلى السحابة"}
      </Button>
      <Button onClick={handleCloudRestore} disabled={cloudRestoreBusy} variant="outline" className="gap-2 border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950/30">
        <UploadCloud className="h-4 w-4" />
        {cloudRestoreBusy ? "جارٍ الاسترجاع..." : "استرجاع آخر نسخة سحابية"}
      </Button>
    </div>
  </CardContent>
</Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" /> تصدير البيانات (نسخة احتياطية)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/40 rounded-xl space-y-2 text-sm">
                  <p className="font-medium text-foreground">سيتم تصدير:</p>
                  {["جميع القضايا وتفاصيلها", "بيانات الموكلين الكاملة", "سجل الجلسات", "المهام والمستندات", "الفواتير والمدفوعات", "المصاريف والتنبيهات", "النماذج القانونية وإعدادات المكتب"].map(item => (
                    <div key={item} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {backupStatus && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${backupStatus.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700"}`}>
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    {backupStatus.msg}
                  </div>
                )}

                <Button onClick={exportAllData} disabled={exportingData} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  {exportingData ? "جارٍ التصدير..." : "تصدير نسخة احتياطية (JSON)"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">يُنصح بأخذ نسخة احتياطية أسبوعياً</p>
              </CardContent>
            </Card>

            {/* Restore Backup */}
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-orange-600" /> استيراد نسخة احتياطية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-orange-100/60 rounded-xl space-y-2 text-sm border border-orange-200">
                  <p className="font-medium text-orange-800">⚠️ تنبيه مهم</p>
                  <p className="text-orange-700 text-xs leading-relaxed">
                    سيتم إضافة البيانات من الملف إلى قاعدة البيانات الحالية (لن يتم حذف أي بيانات موجودة).
                    تأكد من رفع ملف نسخة احتياطية صادر من نظام حلم فقط.
                  </p>
                </div>

                {restoreStatus && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${restoreStatus.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    {restoreStatus.msg}
                  </div>
                )}

                <Button onClick={handleRestoreBackup} disabled={restoring} variant="outline" className="w-full gap-2 border-orange-300 text-orange-700 hover:bg-orange-50">
                  <UploadCloud className="h-4 w-4" />
                  {restoring ? "جارٍ الاستيراد..." : "رفع واستيراد نسخة احتياطية (.json)"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-primary" /> إحصائيات التخزين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "القضايا والبيانات", pct: 35, color: "#1d4ed8" },
                    { label: "المستندات والملفات", pct: 52, color: "#16a34a" },
                    { label: "الفواتير والتقارير", pct: 13, color: "#d97706" },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">سحابي 100%</p>
                  <p className="text-xs text-muted-foreground mt-1">بياناتك محفوظة ومشفرة في السحابة</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== التكاملات ========== */}
        <TabsContent value="integrations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "واتساب بيزنس",
                desc: "إرسال إشعارات ورسائل للموكلين تلقائياً",
                icon: "💬",
                status: "متاح قريباً",
                color: "green",
                features: ["إشعار مواعيد الجلسات", "إرسال الفواتير", "التذكيرات التلقائية"]
              },
              {
                name: "البريد الإلكتروني",
                desc: "إرسال الفواتير والمستندات بريدياً",
                icon: "📧",
                status: "نشط",
                color: "blue",
                features: ["إرسال الفواتير بـ PDF", "تذكير الدفع", "إشعارات الجلسات"]
              },
              {
                name: "منظومة النيابة",
                desc: "ربط مع منظومة النيابة العامة الرقمية",
                icon: "⚖️",
                status: "متاح قريباً",
                color: "purple",
                features: ["تتبع القضايا", "استعلام الجلسات", "قيد القضايا"]
              },
              {
                name: "بوابات الدفع",
                desc: "استقبال المدفوعات إلكترونياً",
                icon: "💳",
                status: "متاح قريباً",
                color: "orange",
                features: ["Stripe", "PayPal", "تحويل بنكي"]
              },
              {
                name: "Google Calendar",
                desc: "مزامنة مواعيد الجلسات مع التقويم",
                icon: "📅",
                status: "متاح قريباً",
                color: "blue",
                features: ["مزامنة الجلسات", "تذكيرات تلقائية", "مشاركة الجداول"]
              },
              {
                name: "التوقيع الإلكتروني",
                desc: "توقيع العقود والوثائق رقمياً",
                icon: "✍️",
                status: "متاح قريباً",
                color: "teal",
                features: ["DocuSign", "توقيع آمن", "سجل الوثائق"]
              },
              {
                name: "نظام المحاسبة",
                desc: "ربط مع برامج المحاسبة",
                icon: "📊",
                status: "متاح قريباً",
                color: "green",
                features: ["QuickBooks", "Xero", "تقارير مالية"]
              },
              {
                name: "التخزين السحابي",
                desc: "رفع المستندات على السحابة",
                icon: "☁️",
                status: "نشط",
                color: "blue",
                features: ["تخزين آمن", "مشاركة آمنة", "OCR تلقائي"]
              },
              {
                name: "منصات التواصل",
                desc: "إدارة حضور المكتب رقمياً",
                icon: "🌐",
                status: "متاح قريباً",
                color: "pink",
                features: ["LinkedIn", "Twitter/X", "نشر تلقائي"]
              },
            ].map((integration, i) => {
              const isActive = integration.status === "نشط";
              return (
                <Card key={i} className={`p-5 ${isActive ? "border-primary/30 bg-primary/2" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">{integration.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{integration.desc}</p>
                      </div>
                    </div>
                    <Badge className={isActive ? "bg-green-100 text-green-700 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                      {integration.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 mb-4">
                    {integration.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Button variant={isActive ? "default" : "outline"} size="sm" className="w-full text-xs" disabled={!isActive}>
                    {isActive ? "إدارة التكامل" : "قريباً"}
                  </Button>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6 p-5 border-accent/30 bg-accent/5">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">طلب تكامل مخصص</h3>
                <p className="text-sm text-muted-foreground">تحتاج إلى ربط نظام حلم مع برنامج خاص بمكتبك؟ يمكننا توفير API مخصص أو تكامل حسب الطلب.</p>
                <Button variant="outline" size="sm" className="mt-3 border-accent/40 text-accent hover:bg-accent/10">
                  <Link2 className="h-3.5 w-3.5 ml-1.5" /> تواصل مع فريق التطوير
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
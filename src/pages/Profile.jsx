import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Upload, X, UserCircle2, Phone, Mail, MapPin, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  nationality: "",
  id_number: "",
  notes: "",
  photo_url: "",
  photo_url_ref: "",
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [clientRow, setClientRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const authUser = await base44.auth.me();
      setUser(authUser);
      const clientRows = authUser.role === 'client' ? await base44.entities.Client.filter({ email: authUser.email }) : [];
      const ownClient = clientRows?.[0] || null;
      setClientRow(ownClient);
      setForm({
        full_name: ownClient?.full_name || authUser.full_name || "",
        email: authUser.email || "",
        phone: ownClient?.phone || "",
        address: ownClient?.address || "",
        nationality: ownClient?.nationality || "",
        id_number: ownClient?.id_number || "",
        notes: ownClient?.notes || "",
        photo_url: authUser.avatar_url || "",
        photo_url_ref: authUser.avatar_url || "",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { preview_url, file_url, storage_ref } = await base44.integrations.Core.UploadFile({ file, folder: `profiles/${Date.now()}` });
    setForm((prev) => ({ ...prev, photo_url: preview_url || file_url, photo_url_ref: storage_ref || file_url }));
  };

  const handleSave = async () => {
    if (!user?.email) return;
    setSaving(true);
    try {
      const avatarUrl = form.photo_url_ref || form.photo_url || null;
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ full_name: form.full_name, avatar_url: avatarUrl, updated_date: new Date().toISOString() })
        .eq('email', user.email);
      if (profileError) throw profileError;

      if (user.role === 'client' && clientRow?.id) {
        await base44.entities.Client.update(clientRow.id, {
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
          nationality: form.nationality,
          id_number: form.id_number,
          notes: form.notes,
        });
      }

      toast.success('تم حفظ الملف الشخصي بنجاح');
      await loadProfile();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'تعذر حفظ الملف الشخصي');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8"><Skeleton className="h-8 w-48 mb-6" /><Skeleton className="h-[420px] rounded-xl" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">الملف الشخصي</h1>
        <p className="text-muted-foreground mt-1">تحديث بيانات الحساب والصورة الشخصية.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCircle2 className="h-5 w-5 text-primary" /> بيانات الحساب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-5">
            {form.photo_url ? (
              <div className="relative">
                <img src={form.photo_url} alt="Profile" className="h-24 w-24 rounded-3xl object-cover shadow-md border" />
                <button onClick={() => setForm((prev) => ({ ...prev, photo_url: '', photo_url_ref: '' }))} className="absolute -top-2 -left-2 h-7 w-7 bg-destructive text-white rounded-full flex items-center justify-center shadow">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="h-24 w-24 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground mt-1">صورة</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            )}
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">الصورة الشخصية</h3>
              <p className="text-sm text-muted-foreground">تُستخدم داخل النظام فقط.</p>
              <Badge variant="outline">{user?.role === 'client' ? 'بوابة موكّل' : 'إدارة / مكتب'}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input value={form.full_name} onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={form.email} readOnly className="pr-10 bg-muted/40" />
              </div>
            </div>
          </div>

          {user?.role === 'client' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className="pr-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>رقم الهوية / السجل</Label>
                  <div className="relative">
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={form.id_number} onChange={(e) => setForm((prev) => ({ ...prev, id_number: e.target.value }))} className="pr-10" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الجنسية</Label>
                  <Input value={form.nationality} onChange={(e) => setForm((prev) => ({ ...prev, nationality: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} className="pr-10" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} className="min-h-[100px]" />
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !form.full_name} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

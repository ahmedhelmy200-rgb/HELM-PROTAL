-- إضافة حقل مفتاح Stripe لإعدادات المكتب
ALTER TABLE public.office_settings
  ADD COLUMN IF NOT EXISTS stripe_publishable_key text;

-- التعليق للتوضيح
COMMENT ON COLUMN public.office_settings.stripe_publishable_key
  IS 'Stripe Publishable Key (pk_live_... or pk_test_...) for online payment';

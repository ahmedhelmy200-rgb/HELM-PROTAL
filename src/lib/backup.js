
import { supabase } from "@/integrations/supabase/client";

const entityTableMap = {
  Case: 'cases',
  Client: 'clients',
  ConnectionRequest: 'connection_requests',
  Conversation: 'conversations',
  Document: 'documents',
  Event: 'events',
  Expense: 'expenses',
  FounderProfile: 'founder_profiles',
  Invoice: 'invoices',
  LegalTemplate: 'legal_templates',
  Message: 'messages',
  Notification: 'notifications',
  OfficeSettings: 'office_settings',
  Session: 'sessions',
  Task: 'tasks',
};

const exportPlan = [
  ['Client', 'clients'],
  ['Case', 'cases'],
  ['Session', 'sessions'],
  ['Task', 'tasks'],
  ['Document', 'documents'],
  ['Invoice', 'invoices'],
  ['Expense', 'expenses'],
  ['LegalTemplate', 'legal_templates'],
  ['Notification', 'notifications'],
  ['Event', 'events'],
  ['Conversation', 'conversations'],
  ['Message', 'messages'],
  ['ConnectionRequest', 'connection_requests'],
  ['FounderProfile', 'founder_profiles'],
  ['OfficeSettings', 'office_settings'],
];

function nowStamp() {
  return new Date().toISOString().split('T')[0];
}

function bucketName() {
  return import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'backups';
}

function fileName(prefix = 'helm-backup') {
  return `${prefix}-${nowStamp()}.json`;
}

function normalizeRecord(record) {
  if (!record || typeof record !== 'object') return record;
  return Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined));
}

export async function collectBackupData(base44) {
  const result = { exported_at: new Date().toISOString() };
  for (const [entityName, key] of exportPlan) {
    try {
      result[key] = await base44.entities[entityName].list();
    } catch {
      result[key] = [];
    }
  }
  return result;
}

export async function downloadLocalBackup(base44) {
  const payload = await collectBackupData(base44);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName('helm-backup');
  a.click();
  URL.revokeObjectURL(url);
  return payload;
}

export async function uploadBackupToCloud(base44) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('يجب تسجيل الدخول أولاً');
  const payload = await collectBackupData(base44);
  const path = `${userData.user.id}/latest.json`;
  const file = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const { error } = await supabase.storage.from(bucketName()).upload(path, file, {
    upsert: true,
    contentType: 'application/json',
    cacheControl: '0',
  });
  if (error) throw error;
  return payload;
}

export async function restoreBackupFromCloud() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('يجب تسجيل الدخول أولاً');
  const path = `${userData.user.id}/latest.json`;
  const { data, error } = await supabase.storage.from(bucketName()).download(path);
  if (error) throw error;
  const text = await data.text();
  return JSON.parse(text);
}

async function upsertRows(table, rows) {
  if (!rows?.length) return 0;
  const cleaned = rows.map(normalizeRecord);
  const { error, data } = await supabase.from(table).upsert(cleaned, { onConflict: 'id' }).select('id');
  if (error) throw error;
  return data?.length || cleaned.length;
}

export async function restoreBackupData(backup) {
  if (!backup || typeof backup !== 'object') throw new Error('ملف النسخة الاحتياطية غير صالح');
  let restored = 0;
  const failures = [];
  const restoreOrder = [
    'clients',
    'office_settings',
    'cases',
    'sessions',
    'tasks',
    'documents',
    'invoices',
    'expenses',
    'legal_templates',
    'notifications',
    'events',
    'conversations',
    'messages',
    'connection_requests',
    'founder_profiles',
  ];

  for (const key of restoreOrder) {
    const rows = backup[key] || [];
    if (!rows.length) continue;
    const table = key;
    try {
      restored += await upsertRows(table, rows);
    } catch (error) {
      failures.push(`${key}: ${error?.message || 'error'}`);
    }
  }

  return {
    restored,
    failures,
    msg: failures.length
      ? `تم الاسترجاع مع بعض الملاحظات. السجلات المعالجة: ${restored}`
      : `تم استرجاع النسخة بنجاح. السجلات المعالجة: ${restored}`,
  };
}

export async function readBackupFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}

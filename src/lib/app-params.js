export const appParams = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  storageBucket: import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'uploads',
  googleRedirectUrl: import.meta.env.VITE_SUPABASE_GOOGLE_REDIRECT_URL || window.location.origin,
  ocrEdgeFunction: import.meta.env.VITE_OCR_EDGE_FUNCTION || 'extract-ocr',
  appName: import.meta.env.VITE_APP_NAME || 'HELM',
}

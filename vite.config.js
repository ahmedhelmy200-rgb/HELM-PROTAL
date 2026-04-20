import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: true,
    port: 5173,
  },
  plugins: [react()],
  build: {
    target: 'es2015',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core' : ['react', 'react-dom', 'react-router-dom'],
          'charts'     : ['recharts'],
          'stripe'     : ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'supabase'   : ['@supabase/supabase-js'],
          'dates'      : ['date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'date-fns', 'recharts'],
  },
})

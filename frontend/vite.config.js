import { defineConfig } from 'vite';
import react         from '@vitejs/plugin-react';
import path          from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    // ── Dev proxy — forwards /api/* to the Express backend ─────────────────
    // This eliminates CORS errors during local development.
    proxy: {
      '/api': {
        // Overridden to http://backend:5000 when running via docker-compose
        target:       process.env.VITE_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        secure:       false,
      },
    },
  },
});

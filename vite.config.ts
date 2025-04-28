// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Configurar un proxy local para desarrollo
      '/api': {
        target: 'https://rhadminback-production.up.railway.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
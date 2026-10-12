import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Every router the Talenti backend (BD_Bolsa_Trabajo) mounts at the root.
// Kept in sync with the `location` block of nginx.conf so dev and prod proxy
// the exact same surface.
const API_PREFIXES = [
  '/api/v1',
  '/job-offers',
  '/applications',
  '/categories',
  '/companies',
  '/memberships',
  '/profiles',
  '/skills',
  '/soft-skills',
  '/cvs',
  '/ats',
  '/evaluaciones',
  '/geography',
  '/analytics',
  '/health',
  '/.well-known',
];

export default defineConfig(() => {
  const apiTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000';
  const proxy = Object.fromEntries(
    API_PREFIXES.map((prefix) => [prefix, {target: apiTarget, changeOrigin: true}])
  );

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Dev proxy: with VITE_API_URL empty the SPA calls same-origin and this
      // forwards to the FastAPI stack, so the browser never hits CORS.
      proxy,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

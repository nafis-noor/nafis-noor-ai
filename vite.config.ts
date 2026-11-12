import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // Strictly only expose VITE_ prefixed variables to client bundle; never leak server secrets
    envPrefix: 'VITE_',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Never emit client-side source maps in production builds
      sourcemap: false,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      fs: {
        strict: true,
        deny: [
          '.env',
          '.env.*',
          '*.{crt,pem,key,map}',
          'server.ts',
          'server/**',
          'firestore.rules',
          'DRAFT_firestore.rules',
          'firebase-blueprint.json',
          'security_spec.md',
        ],
      },
    },
  };
});

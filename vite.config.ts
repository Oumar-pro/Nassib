import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

const profileDataBridge: Plugin = {
  name: 'nassib-profile-data-bridge',
  enforce: 'pre',
  resolveId(source, importer) {
    if (importer?.endsWith('/src/lib/profileData.ts') || importer?.endsWith('/src/lib/profileDataRuntime.ts')) return null;
    if (source === './lib/database' || source === './lib/database.ts') {
      return path.resolve(__dirname, 'src/lib/profileDataRuntime.ts');
    }
    return null;
  },
};

export default defineConfig(() => ({
  plugins: [profileDataBridge, react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));

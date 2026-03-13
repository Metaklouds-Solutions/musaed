import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

/**
 * Vite configuration for AgentOs — Clinic Revenue
 * 
 * To allow external hosts (e.g., for tunneling/link access), use the `server.allowedHosts` array.
 * 
 * @see https://vitejs.dev/config/server-options.html#server-allowedhosts
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'AgentOs — Clinic Revenue',
          short_name: 'AgentOs',
          description: 'Clinic CRM with AI voice agents',
          theme_color: '#7C5CFF',
          background_color: '#0B0F19',
          display: 'standalone',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    optimizeDeps: {
      include: ['socket.io-client'],
    },
    server: {
      port: Number(env.VITE_PORT) || 3002,
      strictPort: false,
      hmr: process.env.DISABLE_HMR !== 'true',
      allowedHosts: ["noncancelable-natalie-scripturally.ngrok-free.dev"],
    },
  };
});

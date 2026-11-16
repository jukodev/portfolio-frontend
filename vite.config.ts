import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    manifest: { id: '/', name: 'Portfolio · Dein Vermögen im Blick', short_name: 'Portfolio', lang: 'de', start_url: '/#/dashboard', scope: '/', display: 'standalone', background_color: '#f6f7f5', theme_color: '#2c6a57', icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ] },
    workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'], globIgnores: ['ocr/**'], navigateFallbackDenylist: [/^\/api\//], maximumFileSizeToCacheInBytes: 4 * 1024 * 1024 },
  })],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, strictPort: true, proxy: { '/api': { target: 'http://localhost:5071', changeOrigin: true } } },
  preview: { port: 4173, proxy: { '/api': { target: 'http://localhost:5071', changeOrigin: true } } },
  build: {
    rolldownOptions: { output: { codeSplitting: { groups: [
      { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 20 },
      { name: 'charts', test: /node_modules[\\/](recharts|victory-vendor|d3-[^\\/]+)[\\/]/, priority: 15 },
      { name: 'vendor', test: /node_modules/, priority: 10 },
    ] } } },
  },
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'STITCHD',
        short_name: 'STITCHD',
        description: 'Events, stitched together.',
        theme_color: '#0A0A0E',
        background_color: '#0A0A0E',
        display: 'standalone',
        icons: [],
      },
    }),
  ],
})

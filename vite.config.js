import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png", "icons/*.svg"],
      manifest: {
        name:             "Pantry",
        short_name:       "Pantry",
        description:      "Household inventory management",
        theme_color:      "#0a0a0a",
        background_color: "#0a0a0a",
        display:          "standalone",
        orientation:      "portrait",
        scope:            "/",
        start_url:        "/",
        icons: [
          {
            src:   "icons/icon-192.png",
            sizes: "192x192",
            type:  "image/png",
          },
          {
            src:   "icons/icon-512.png",
            sizes: "512x512",
            type:  "image/png",
          },
          {
            src:     "icons/icon-512.png",
            sizes:   "512x512",
            type:    "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Cache all static assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Don't cache Firebase or Cloudinary API calls
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler:    "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler:    "CacheFirst",
            options: {
              cacheName:        "cloudinary-images",
              expiration: {
                maxEntries:       100,
                maxAgeSeconds:    30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
  },
});

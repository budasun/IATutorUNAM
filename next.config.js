const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    // Pre-cache las rutas críticas que deben funcionar offline
    additionalManifestEntries: [
      { url: '/', revision: Date.now().toString() },
      { url: '/temario', revision: Date.now().toString() },
      { url: '/progreso', revision: Date.now().toString() },
    ],
    // Runtime caching: cachear páginas, JS, CSS, imágenes y fuentes
    runtimeCaching: [
      // 1. Cachear todas las navegaciones de páginas (HTML) con NetworkFirst
      {
        urlPattern: /^https?:\/\/.*\/(?:temario|progreso|diagnostico|simulador|debilidades|login)?$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
          },
          networkTimeoutSeconds: 3,
        },
      },
      // 2. Cachear chunks de JS y CSS de Next.js (StaleWhileRevalidate)
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'next-static-cache',
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
          },
        },
      },
      // 3. Cachear data chunks de Next.js (RSC payloads)
      {
        urlPattern: /\/_next\/data\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'next-data-cache',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
          networkTimeoutSeconds: 3,
        },
      },
      // 4. Cachear imágenes e íconos (CacheFirst)
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
        },
      },
      // 5. Cachear fuentes (CacheFirst)
      {
        urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts-cache',
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
      // 6. Cachear CSS externo (ejemplo: KaTeX)
      {
        urlPattern: /\.css$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'css-cache',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
        },
      },
    ],
  },
  // Ya no usamos fallback a offline.html porque las páginas estarán cacheadas
});

module.exports = withPWA({
  reactStrictMode: true,
  webpack: (config) => config,
  turbopack: {},
});
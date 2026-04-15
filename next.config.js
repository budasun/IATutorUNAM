const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  scope: '/',
  sw: 'service-worker.js',
  publicDirectory: true,
  runtimeCaching: [
    {
      urlPattern: /^(?!\/_next\/static).+/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'app-shell-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }
      }
    },
    {
      urlPattern: /^\/_next\/static/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
      }
    },
    {
      urlPattern: /^\/$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'home-page',
        expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 }
      }
    },
    {
      urlPattern: /\.(js|css|woff2|woff|ttf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }
      }
    },
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'google-fonts-stylesheets' }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => config,
  turbopack: {},
};

module.exports = withPWA(nextConfig);
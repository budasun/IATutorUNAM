const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    additionalManifestEntries: [
      { url: '/', revision: '1' }
    ]
  },
  fallbacks: {
    document: '/offline.html',
  }
});

module.exports = withPWA({
  reactStrictMode: true,
  webpack: (config) => config,
  turbopack: {},
});
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  // disable: process.env.NODE_ENV === 'development',
  register: true,
  scope: '/',
  sw: 'service-worker.js',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => config,
  turbopack: {},
};

module.exports = withPWA(nextConfig);
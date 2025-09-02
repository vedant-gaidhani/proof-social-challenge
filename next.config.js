/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development checks
  reactStrictMode: true,
  // Enable experimental features we need
  experimental: {
    // This is the correct property for Next.js 15+
    serverActions: {
      bodySizeLimit: '2mb'
    },
  },
  // Typescript settings
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Disable source maps in development for faster builds
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig

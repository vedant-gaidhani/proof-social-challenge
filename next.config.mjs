/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development checks
  reactStrictMode: true,
  // Enable experimental features
  experimental: {
    // Enable server components
    serverComponents: true,
    // Enable server actions
    serverActions: true,
  },
  // Typescript configs
  typescript: {
    // Generate sourcemaps for better debugging
    sourcemaps: true,
    // Enable incremental typechecking
    incremental: true,
  },
}

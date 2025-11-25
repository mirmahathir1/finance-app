/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  typescript: {
    // Ensure TypeScript errors are caught during build
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig


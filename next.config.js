/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration for Cloudflare Pages
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
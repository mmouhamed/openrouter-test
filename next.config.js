/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration for Cloudflare Pages
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Webpack configuration to reduce bundle size
  webpack: (config, { dev, isServer }) => {
    // Optimize webpack cache for production
    if (!dev) {
      config.cache = {
        type: 'memory', // Use memory cache instead of filesystem cache for production
      };
    }
    
    return config;
  },
}

module.exports = nextConfig
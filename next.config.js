/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['prisma', '@prisma/client'],
  // Ensure proper handling of static assets
  images: {
    domains: [],
  },
  // Webpack configuration for better compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig

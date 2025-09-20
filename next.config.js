

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server external packages for Vercel deployment
  serverExternalPackages: ['prisma', '@prisma/client'],

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ];
  },
}

module.exports = nextConfig

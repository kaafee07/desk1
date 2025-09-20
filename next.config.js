/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server external packages for Vercel deployment
  serverExternalPackages: ['prisma', '@prisma/client'],

  // Image optimization configuration
  images: {
    domains: [],
    unoptimized: false, // Enable optimization for better performance
  },

  // Output configuration for Vercel
  output: 'standalone',

  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },

  // Webpack configuration for better compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };

      // Fix for 'self is not defined' error
      config.resolve.alias = {
        ...config.resolve.alias,
        'self': false,
      };
    }

    // Add global polyfills
    config.plugins = config.plugins || [];
    config.plugins.push(
      new config.webpack.DefinePlugin({
        'global.self': 'globalThis',
      })
    );

    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };

    return config;
  },

  // Environment variables that should be available on the client
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
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

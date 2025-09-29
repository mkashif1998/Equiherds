/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lms-api.wiserbee.ca',
        port: '',
        pathname: '/Upload/Documents/**',
      },
    ],
  },
  // Suppress Ant Design React 19 compatibility warning
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Suppress specific warnings during build
    config.infrastructureLogging = {
      level: 'error',
    };
    
    return config;
  },
  // Suppress console warnings in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  // Experimental features for better React 19 support
  experimental: {
    reactCompiler: false,
  },
  // Suppress specific warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
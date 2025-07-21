/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Re-enabled TypeScript and ESLint for production builds
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:3005', 'localhost:3006']
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      },
      {
        protocol: 'http',
        hostname: 'localhost'
      }
    ]
  },
  // Environment variables that should be exposed to the browser
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
  },
  // Webpack configuration to ensure environment variables are available on the client
  webpack: (config) => {
    // This makes sure that environment variables are available in the browser
    config.plugins = config.plugins || [];
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  // Configure page extensions for API routes
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mjs'],
  // Enable React Strict Mode
  reactStrictMode: true,
  // Configure headers
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

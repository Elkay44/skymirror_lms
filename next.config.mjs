/** @type {import('next').NextConfig} */
const nextConfig = {
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
  }
};

export default nextConfig;

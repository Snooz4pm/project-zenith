import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Redirect www to non-www for consistent auth (NEXTAUTH_URL must match)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.zenithscores.com',
          },
        ],
        destination: 'https://zenithscores.com/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds (too many pre-existing issues)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds even with type errors
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Ignore optional wagmi connector dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'porto/internal': false,
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://project-zenith-zexd.vercel.app/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
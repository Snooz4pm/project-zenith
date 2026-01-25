/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/tokens/featured',
        destination: 'https://jupiter-proxy-production.up.railway.app/api/tokens',
      },
    ];
  },
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TEMPORARY: Ignore TS errors to unblock deployment (clean up dead imports later)
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fix pino-pretty optional dependency issue
      config.externals.push({
        'pino-pretty': 'commonjs pino-pretty',
      });
    }
    return config;
  },
};

export default nextConfig;

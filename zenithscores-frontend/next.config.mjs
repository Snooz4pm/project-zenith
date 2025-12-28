/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checks during builds (optional, can remove if you want type checking)
    ignoreBuildErrors: false,
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

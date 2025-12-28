/** @type {import('next').NextConfig} */
const nextConfig = {
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

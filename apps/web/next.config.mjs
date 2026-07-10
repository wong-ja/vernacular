/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vernacular/shared', '@vernacular/glossary'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

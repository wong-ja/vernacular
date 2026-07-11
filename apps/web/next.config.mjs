/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vernacular/shared', '@vernacular/glossary'],
  async rewrites() {
    const raw = process.env.API_URL || 'http://localhost:3001';
    const base = (raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`).replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${base}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

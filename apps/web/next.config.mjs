/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vernacular/shared', '@vernacular/glossary'],
};

export default nextConfig;

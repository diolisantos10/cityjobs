/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Allow image uploads through Server Actions (default is 1 MB).
    serverActions: { bodySizeLimit: '6mb' },
  },
};

export default nextConfig;

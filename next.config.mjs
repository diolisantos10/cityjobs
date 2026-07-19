/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Allow image uploads through Server Actions (default is 1 MB).
    serverActions: { bodySizeLimit: '6mb' },
    // Enable instrumentation.ts register() hook (in-process scheduler).
    instrumentationHook: true,
  },
};

export default nextConfig;

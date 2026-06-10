/** @type {import('next').NextConfig} */
const extraDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ? process.env.NEXT_ALLOWED_DEV_ORIGINS.split(',').map(s => s.trim())
  : [];

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'http://backend:8000/:path*',
      },
    ];
  },
  allowedDevOrigins: ['*.ngrok-free.dev', '*.ngrok.io', '*.ngrok-free.app', ...extraDevOrigins],
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kyhxmyhtowrqmhglmkhu.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    middlewareClientMaxBodySize: 52428800, // 50MB
  },
  serverActions: {
    bodySizeLimit: '50mb',
  },
}

export default nextConfig

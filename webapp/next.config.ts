import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression

  // Experimental features
  experimental: {
    // Future experimental features will be added here as needed
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers (additional to middleware)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      // Note: HTTPS redirect is handled by Vercel automatically in production
      // Removed deprecated :host syntax to fix Node.js DEP0170 warning
    ];
  },
};

// Export configuration
// Note: Sentry integration requires @sentry/nextjs to be installed
// If you want to enable Sentry monitoring, install it with: npm install @sentry/nextjs
export default nextConfig;

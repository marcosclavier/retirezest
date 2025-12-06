import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

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
      // Redirect HTTP to HTTPS in production
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: '/:path*',
              has: [
                {
                  type: 'header',
                  key: 'x-forwarded-proto',
                  value: 'http',
                },
              ],
              destination: 'https://:host/:path*',
              permanent: true,
            },
          ]
        : []),
    ];
  },
};

// Export configuration with Sentry if DSN is configured
// Sentry integration is optional - only wraps config if SENTRY_DSN is set
export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      // Sentry Webpack Plugin Options
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      reactComponentAnnotation: {
        enabled: true,
      },
      tunnelRoute: "/monitoring",
      sourcemaps: {
        disable: true, // Disable source map uploads in development
      },
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : nextConfig;

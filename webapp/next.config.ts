import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Output configuration for Docker/Railway deployment
  output: 'standalone',

  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression

  // Optimize production bundle for better client battery life
  productionBrowserSourceMaps: false, // Disable source maps in production (reduces bundle size)

  // Note: SWC minification is enabled by default in Next.js 15+

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-dialog'],
    webVitalsAttribution: ['CLS', 'LCP'], // Monitor performance
  },

  // Optimize CSS
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
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

// Export configuration with bundle analyzer
// Note: Sentry integration requires @sentry/nextjs to be installed
// If you want to enable Sentry monitoring, install it with: npm install @sentry/nextjs
// To run bundle analysis: ANALYZE=true npm run build
export default withBundleAnalyzer(nextConfig);

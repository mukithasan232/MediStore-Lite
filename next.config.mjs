/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // If you are using Turbopack, explicitly setting the root can resolve inference issues
    // Note: 'turbo' configuration in next.config.js is slightly different in 14.x
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        // Security Headers for DDoS and Attack Protection
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff' // Prevent MIME type sniffing
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY' // Prevent clickjacking attacks
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block' // Enable XSS protection in older browsers
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin' // Control referrer information
        },
        {
          key: 'Permissions-Policy',
          value: 'geolocation=(), microphone=(), camera=()' // Restrict dangerous features
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload' // Enforce HTTPS
        },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel.app; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' *.supabase.co *.vercel.app; frame-ancestors 'none';"
        },
      ],
    },
  ],
};

export default nextConfig;

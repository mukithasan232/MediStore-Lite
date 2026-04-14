/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // If you are using Turbopack, explicitly setting the root can resolve inference issues
    // Note: 'turbo' configuration in next.config.js is slightly different in 14.x
  },
};

export default nextConfig;

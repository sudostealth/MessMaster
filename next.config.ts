import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true, // Disabled to resolve potential Netlify build issues
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all for now, specific domains better for prod
      },
    ],
  },
  // Ensure we use the standard output for Netlify's plugin to handle
};

export default nextConfig;

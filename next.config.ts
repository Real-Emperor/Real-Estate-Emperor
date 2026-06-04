import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  serverExternalPackages: ['bcryptjs', 'otplib', 'pdfkit'],
  output: 'standalone',
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  serverExternalPackages: ['bcryptjs', 'otplib', 'pdfkit'],
  output: 'standalone',
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingIncludes: {
    "/*": ["./dev.db", "./prisma/migrations/**/*"],
  },
};

export default nextConfig;

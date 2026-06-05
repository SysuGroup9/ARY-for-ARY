import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./dev.db", "./prisma/migrations/**/*"],
  },
};

export default nextConfig;

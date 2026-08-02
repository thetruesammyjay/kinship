import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // This app lives in a pnpm monorepo. Pin the file-tracing root to apps/web
  // so Next doesn't pick up the workspace-root lockfile.
  outputFileTracingRoot: here,
  eslint: { ignoreDuringBuilds: true },
  // lucide-react is a barrel package; rewrite to direct imports so every page
  // doesn't pull thousands of icon modules into its compile.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;

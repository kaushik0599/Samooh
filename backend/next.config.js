const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  // @samooh/types is plain TypeScript source with no build step (a local
  // workspace package, not a published npm package) — Next.js only
  // transpiles files under node_modules that are explicitly listed here.
  transpilePackages: ["@samooh/types"],
};

module.exports = nextConfig;

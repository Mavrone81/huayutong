import { execSync } from "node:child_process";

// Capture the deployed commit + build time so /api/v1/version can report exactly
// what's live (the auto-deploy does `git reset --hard` then `npm run build`, so
// this resolves to the deployed SHA). Falls back gracefully if git is unavailable.
let gitSha = process.env.GIT_SHA || "";
if (!gitSha) {
  try {
    gitSha = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    gitSha = "unknown";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    GIT_SHA: gitSha,
    BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;

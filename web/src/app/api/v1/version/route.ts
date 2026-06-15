import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Health/version endpoint. `commit` is baked in at build time (see next.config.mjs)
// so it reflects exactly which code is live — use it to verify CI/CD auto-deploy.
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "mandamix-web",
    commit: process.env.GIT_SHA || "unknown",
    builtAt: process.env.BUILD_TIME || null,
    marker: "cicd-auto-unattended-2026-06-15",
  });
}

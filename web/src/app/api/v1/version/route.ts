import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight health/version endpoint — also used to verify CI/CD auto-deploy.
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "mandamix-web",
    marker: "cicd-live-2026-06-08",
  });
}

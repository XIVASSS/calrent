import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  let buildId = "unknown";
  try {
    buildId = readFileSync(join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
  } catch {
    buildId = "no-next-build-run-start-without-build";
  }

  return NextResponse.json(
    {
      buildId,
      nodeEnv: process.env.NODE_ENV ?? null,
      pid: process.pid,
      cwd: process.cwd(),
      respondedAt: new Date().toISOString(),
      hint:
        "Open this URL on every host/port you try (localhost:3000, :4100, etc.). If buildId differs, you are hitting a different process or folder.",
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

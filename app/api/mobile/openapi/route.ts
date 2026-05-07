import { NextResponse } from "next/server";
import { buildMobileOpenApiSpec, getMobileApiExportFileName } from "@/lib/mobile-api-contract-export";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const baseUrl = requestUrl.searchParams.get("baseUrl")?.trim() || requestUrl.origin;

  return NextResponse.json(buildMobileOpenApiSpec(baseUrl), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${getMobileApiExportFileName("openapi")}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

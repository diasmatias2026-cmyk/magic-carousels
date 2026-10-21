import { NextRequest, NextResponse } from "next/server";
export function proxy(req: NextRequest) {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    !req.nextUrl.pathname.startsWith("/api/webhooks/")
  ) {
    const origin = req.headers.get("origin");
    const configured = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
    const expected = configured
      ? new URL(configured).origin
      : req.nextUrl.origin;
    if (!origin || ![expected, req.nextUrl.origin].includes(origin))
      return NextResponse.json(
        { error: "Origem não permitida." },
        { status: 403 },
      );
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  return response;
}
export const config = { matcher: ["/api/:path*"] };

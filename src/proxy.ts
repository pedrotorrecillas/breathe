import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  REQUEST_PATH_HEADER,
  SESSION_COOKIE_NAME,
  buildLoginPath,
} from "@/lib/auth/constants";

function withRequestPathHeader(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set(
    REQUEST_PATH_HEADER,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return headers;
}

export function proxy(request: NextRequest) {
  const requestHeaders = withRequestPathHeader(request);
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const pathname = request.nextUrl.pathname;

  if (!hasSessionCookie && pathname.startsWith("/api/recruiter")) {
    return NextResponse.json(
      {
        success: false,
        error: "Authentication required.",
      },
      { status: 401 },
    );
  }

  if (!hasSessionCookie && pathname.startsWith("/jobs")) {
    return NextResponse.redirect(
      new URL(
        buildLoginPath(`${request.nextUrl.pathname}${request.nextUrl.search}`),
        request.url,
      ),
    );
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/jobs/:path*", "/api/recruiter/:path*"],
};

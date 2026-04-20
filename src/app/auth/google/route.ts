import { NextResponse } from "next/server";

import {
  DEFAULT_AUTH_REDIRECT_PATH,
  GOOGLE_OAUTH_NEXT_COOKIE_NAME,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  LOGIN_PATH,
  sanitizeRedirectTarget,
} from "@/lib/auth/constants";
import {
  buildGoogleAuthorizationUrl,
  createGoogleOauthState,
  resolveAuthBaseUrl,
} from "@/lib/auth/google";

function isSecureCookieRequest(request: Request) {
  return request.url.startsWith("https://");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = sanitizeRedirectTarget(
    url.searchParams.get("next"),
    DEFAULT_AUTH_REDIRECT_PATH,
  );
  const state = createGoogleOauthState();
  const authorization = buildGoogleAuthorizationUrl({
    nextPath,
    origin: url.origin,
    state,
  });

  if (!authorization) {
    const loginUrl = new URL(
      LOGIN_PATH,
      resolveAuthBaseUrl(url.origin),
    );
    loginUrl.searchParams.set("error", "google_not_configured");

    if (nextPath !== DEFAULT_AUTH_REDIRECT_PATH) {
      loginUrl.searchParams.set("next", nextPath);
    }

    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(authorization.authorizationUrl);
  const secure = isSecureCookieRequest(request);

  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure,
  });
  response.cookies.set(GOOGLE_OAUTH_NEXT_COOKIE_NAME, authorization.nextPath, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure,
  });

  return response;
}

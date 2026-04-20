import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_AUTH_REDIRECT_PATH,
  GOOGLE_OAUTH_NEXT_COOKIE_NAME,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  LOGIN_PATH,
  sanitizeRedirectTarget,
} from "@/lib/auth/constants";
import {
  exchangeGoogleCodeForUserProfile,
  resolveAuthBaseUrl,
} from "@/lib/auth/google";
import { applySessionCookie } from "@/lib/auth/server";
import { authenticateGoogleUser } from "@/lib/auth/store";

function redirectToLogin(
  request: NextRequest,
  params: {
    error: string;
    nextPath?: string | null;
  },
) {
  const url = new URL(LOGIN_PATH, resolveAuthBaseUrl(request.nextUrl.origin));
  url.searchParams.set("error", params.error);

  const nextPath = sanitizeRedirectTarget(
    params.nextPath,
    DEFAULT_AUTH_REDIRECT_PATH,
  );

  if (nextPath !== DEFAULT_AUTH_REDIRECT_PATH) {
    url.searchParams.set("next", nextPath);
  }

  const response = NextResponse.redirect(url);
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
  response.cookies.delete(GOOGLE_OAUTH_NEXT_COOKIE_NAME);
  return response;
}

export async function GET(request: NextRequest) {
  const googleError = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(
    GOOGLE_OAUTH_STATE_COOKIE_NAME,
  )?.value;
  const nextPath = request.cookies.get(GOOGLE_OAUTH_NEXT_COOKIE_NAME)?.value;

  if (googleError) {
    return redirectToLogin(request, {
      error:
        googleError === "access_denied"
          ? "google_access_denied"
          : "google_signin_failed",
      nextPath,
    });
  }

  if (
    !code ||
    !returnedState ||
    !storedState ||
    returnedState !== storedState
  ) {
    return redirectToLogin(request, {
      error: "google_state_mismatch",
      nextPath,
    });
  }

  try {
    const profile = await exchangeGoogleCodeForUserProfile({
      code,
      origin: request.nextUrl.origin,
    });

    if (!profile.emailVerified) {
      return redirectToLogin(request, {
        error: "google_unverified_email",
        nextPath,
      });
    }

    const authenticated = await authenticateGoogleUser({
      email: profile.email,
      emailVerified: profile.emailVerified,
    });

    if (!authenticated) {
      return redirectToLogin(request, {
        error: "google_account_not_allowed",
        nextPath,
      });
    }

    const destination = sanitizeRedirectTarget(
      nextPath,
      DEFAULT_AUTH_REDIRECT_PATH,
    );
    const response = NextResponse.redirect(
      new URL(destination, resolveAuthBaseUrl(request.nextUrl.origin)),
    );
    applySessionCookie(
      response,
      authenticated.token,
      authenticated.recruiter.session.expiresAt,
    );
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
    response.cookies.delete(GOOGLE_OAUTH_NEXT_COOKIE_NAME);
    return response;
  } catch {
    return redirectToLogin(request, {
      error: "google_signin_failed",
      nextPath,
    });
  }
}

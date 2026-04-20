import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import {
  buildLoginPath,
  DEFAULT_AUTH_REDIRECT_PATH,
  REQUEST_PATH_HEADER,
  sanitizeRedirectTarget,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import {
  getAuthenticatedRecruiterBySessionToken,
  invalidateSession,
} from "@/lib/auth/store";

function isSecureCookieRequest() {
  return process.env.NODE_ENV === "production";
}

function buildSessionCookieOptions(expiresAt: string) {
  return {
    expires: new Date(expiresAt),
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: isSecureCookieRequest(),
  };
}

function buildClearedCookieOptions() {
  return {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax" as const,
    secure: isSecureCookieRequest(),
  };
}

async function readSessionToken() {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function setSessionCookie(token: string, expiresAt: string) {
  (await cookies()).set(
    SESSION_COOKIE_NAME,
    token,
    buildSessionCookieOptions(expiresAt),
  );
}

export function applySessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: string,
) {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    token,
    buildSessionCookieOptions(expiresAt),
  );
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE_NAME, "", buildClearedCookieOptions());
}

export function clearSessionCookieFromResponse(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", buildClearedCookieOptions());
}

export async function getCurrentRecruiter() {
  const token = await readSessionToken();
  const recruiter = await getAuthenticatedRecruiterBySessionToken(token);

  if (!recruiter) {
    return null;
  }

  return recruiter;
}

async function getRequestedPath() {
  return sanitizeRedirectTarget(
    (await headers()).get(REQUEST_PATH_HEADER),
    DEFAULT_AUTH_REDIRECT_PATH,
  );
}

export async function requireAuthenticatedRecruiter() {
  const recruiter = await getCurrentRecruiter();

  if (!recruiter) {
    redirect(buildLoginPath(await getRequestedPath()));
  }

  return recruiter;
}

export async function requireAuthenticatedApiRequest() {
  const recruiter = await getCurrentRecruiter();

  if (!recruiter) {
    return NextResponse.json(
      {
        success: false,
        error: "Authentication required.",
      },
      { status: 401 },
    );
  }

  return recruiter;
}

export async function signOutCurrentSession() {
  const token = await readSessionToken();
  await invalidateSession(token);
  await clearSessionCookie();
}

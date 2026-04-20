export const SESSION_COOKIE_NAME = "bre_session";
export const GOOGLE_OAUTH_STATE_COOKIE_NAME = "bre_google_oauth_state";
export const GOOGLE_OAUTH_NEXT_COOKIE_NAME = "bre_google_oauth_next";
export const AUTH_PATH_PREFIX = "/auth";
export const LOGIN_PATH = "/auth/login";
export const LOGOUT_PATH = "/auth/logout";
export const GOOGLE_AUTH_PATH = "/auth/google";
export const GOOGLE_AUTH_CALLBACK_PATH = "/auth/google/callback";
export const DEFAULT_AUTH_REDIRECT_PATH = "/jobs";
export const REQUEST_PATH_HEADER = "x-breathe-request-path";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
export const SESSION_REFRESH_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 7;

export function sanitizeRedirectTarget(
  candidate: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT_PATH,
) {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  if (candidate.startsWith(AUTH_PATH_PREFIX)) {
    return fallback;
  }

  return candidate;
}

export function buildLoginPath(nextPath?: string | null) {
  const redirectTarget = sanitizeRedirectTarget(nextPath);
  const params = new URLSearchParams();

  if (redirectTarget !== DEFAULT_AUTH_REDIRECT_PATH) {
    params.set("next", redirectTarget);
  }

  const query = params.toString();
  return query ? `${LOGIN_PATH}?${query}` : LOGIN_PATH;
}

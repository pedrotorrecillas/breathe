import { randomBytes } from "node:crypto";

import {
  DEFAULT_AUTH_REDIRECT_PATH,
  GOOGLE_AUTH_CALLBACK_PATH,
  sanitizeRedirectTarget,
} from "@/lib/auth/constants";

export type GoogleUserProfile = {
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
  subject: string;
};

type GoogleAuthConfig = {
  clientId: string;
  clientSecret: string;
  hostedDomain: string | null;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfoResponse = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  sub?: string;
};

function readGoogleAuthConfig(): GoogleAuthConfig | null {
  const clientId = process.env.AUTH_GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.AUTH_GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    hostedDomain: process.env.AUTH_GOOGLE_HOSTED_DOMAIN?.trim() || null,
  };
}

export function isGoogleAuthEnabled() {
  return readGoogleAuthConfig() !== null;
}

export function createGoogleOauthState() {
  return randomBytes(24).toString("base64url");
}

function resolveAuthOrigin(origin: string) {
  return process.env.AUTH_BASE_URL?.trim() || origin;
}

export function resolveAuthBaseUrl(origin: string) {
  return resolveAuthOrigin(origin);
}

export function buildGoogleCallbackUrl(origin: string) {
  return new URL(GOOGLE_AUTH_CALLBACK_PATH, resolveAuthOrigin(origin)).toString();
}

export function buildGoogleAuthorizationUrl(params: {
  nextPath?: string | null;
  origin: string;
  state: string;
}) {
  const config = readGoogleAuthConfig();

  if (!config) {
    return null;
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", buildGoogleCallbackUrl(params.origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("prompt", "select_account");

  if (config.hostedDomain) {
    url.searchParams.set("hd", config.hostedDomain);
  }

  return {
    authorizationUrl: url.toString(),
    nextPath: sanitizeRedirectTarget(
      params.nextPath,
      DEFAULT_AUTH_REDIRECT_PATH,
    ),
  };
}

export async function exchangeGoogleCodeForUserProfile(params: {
  code: string;
  origin: string;
}) {
  const config = readGoogleAuthConfig();

  if (!config) {
    throw new Error("Google auth is not configured.");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: params.code,
      grant_type: "authorization_code",
      redirect_uri: buildGoogleCallbackUrl(params.origin),
    }),
  });

  const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new Error(
      tokenPayload.error_description ||
        tokenPayload.error ||
        "Token exchange failed.",
    );
  }

  const userInfoResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: {
        authorization: `Bearer ${tokenPayload.access_token}`,
      },
    },
  );

  const userInfo = (await userInfoResponse.json()) as GoogleUserInfoResponse;

  if (!userInfoResponse.ok || !userInfo.email || !userInfo.sub) {
    throw new Error("Failed to load Google user profile.");
  }

  if (config.hostedDomain) {
    const userDomain = userInfo.email.split("@")[1]?.toLowerCase() ?? "";

    if (userDomain !== config.hostedDomain.toLowerCase()) {
      throw new Error("Google account is outside the allowed hosted domain.");
    }
  }

  return {
    email: userInfo.email,
    emailVerified: Boolean(userInfo.email_verified),
    name: userInfo.name || userInfo.email,
    picture: userInfo.picture || null,
    subject: userInfo.sub,
  } satisfies GoogleUserProfile;
}

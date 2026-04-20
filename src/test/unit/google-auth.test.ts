import { afterEach, describe, expect, it } from "vitest";

import {
  buildGoogleAuthorizationUrl,
  buildGoogleCallbackUrl,
  isGoogleAuthEnabled,
} from "@/lib/auth/google";

const ORIGINAL_ENV = {
  AUTH_GOOGLE_CLIENT_ID: process.env.AUTH_GOOGLE_CLIENT_ID,
  AUTH_GOOGLE_CLIENT_SECRET: process.env.AUTH_GOOGLE_CLIENT_SECRET,
  AUTH_GOOGLE_HOSTED_DOMAIN: process.env.AUTH_GOOGLE_HOSTED_DOMAIN,
};

function resetGoogleEnv() {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (typeof value === "string") {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }
}

describe("google auth helpers", () => {
  afterEach(() => {
    resetGoogleEnv();
  });

  it("reports whether Google auth is configured", () => {
    delete process.env.AUTH_GOOGLE_CLIENT_ID;
    delete process.env.AUTH_GOOGLE_CLIENT_SECRET;

    expect(isGoogleAuthEnabled()).toBe(false);

    process.env.AUTH_GOOGLE_CLIENT_ID = "google-client-id";
    process.env.AUTH_GOOGLE_CLIENT_SECRET = "google-client-secret";

    expect(isGoogleAuthEnabled()).toBe(true);
  });

  it("builds an authorization URL with redirect, state, and hosted domain guardrails", () => {
    process.env.AUTH_GOOGLE_CLIENT_ID = "google-client-id";
    process.env.AUTH_GOOGLE_CLIENT_SECRET = "google-client-secret";
    process.env.AUTH_GOOGLE_HOSTED_DOMAIN = "breathe.test";

    const authorization = buildGoogleAuthorizationUrl({
      nextPath: "/jobs/new?draft=1",
      origin: "http://localhost:3000",
      state: "oauth-state",
    });

    expect(authorization?.nextPath).toBe("/jobs/new?draft=1");

    const url = new URL(authorization?.authorizationUrl ?? "");
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.pathname).toBe("/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("google-client-id");
    expect(url.searchParams.get("redirect_uri")).toBe(
      buildGoogleCallbackUrl("http://localhost:3000"),
    );
    expect(url.searchParams.get("state")).toBe("oauth-state");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("hd")).toBe("breathe.test");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockSignOutCurrentSession = vi.fn();
const mockExchangeGoogleCodeForUserProfile = vi.fn();
const mockAuthenticateGoogleUser = vi.fn();

vi.mock("@/lib/auth/server", () => ({
  signOutCurrentSession: (...args: unknown[]) => mockSignOutCurrentSession(...args),
  applySessionCookie: vi.fn(),
}));

vi.mock("@/lib/auth/google", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/google")>(
    "@/lib/auth/google",
  );

  return {
    ...actual,
    exchangeGoogleCodeForUserProfile: (...args: unknown[]) =>
      mockExchangeGoogleCodeForUserProfile(...args),
  };
});

vi.mock("@/lib/auth/store", () => ({
  authenticateGoogleUser: (...args: unknown[]) => mockAuthenticateGoogleUser(...args),
}));

describe("auth redirect safety", () => {
  const originalBaseUrl = process.env.AUTH_BASE_URL;

  afterEach(() => {
    vi.clearAllMocks();

    if (originalBaseUrl) {
      process.env.AUTH_BASE_URL = originalBaseUrl;
    } else {
      delete process.env.AUTH_BASE_URL;
    }
  });

  it("uses AUTH_BASE_URL when logging out instead of an internal machine host", async () => {
    process.env.AUTH_BASE_URL = "https://breathe-staging-pedro.fly.dev";

    const { POST } = await import("@/app/auth/logout/route");
    const response = await POST(new Request("http://0.0.0.0:3000/auth/logout", { method: "POST" }));

    expect(response.headers.get("location")).toBe(
      "https://breathe-staging-pedro.fly.dev/auth/login?logged_out=1",
    );
  });

  it("sanitizes next cookies during Google callback failures", async () => {
    process.env.AUTH_BASE_URL = "https://breathe-staging-pedro.fly.dev";

    const { GET } = await import("@/app/auth/google/callback/route");
    const request = new NextRequest(
      "http://0.0.0.0:3000/auth/google/callback?error=access_denied",
      {
        headers: {
          cookie: "bre_google_oauth_next=//evil.example; bre_google_oauth_state=abc",
        },
      },
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://breathe-staging-pedro.fly.dev/auth/login?error=google_access_denied",
    );
  });
});

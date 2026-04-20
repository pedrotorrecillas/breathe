import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "@/proxy";

describe("auth middleware", () => {
  it("redirects unauthenticated recruiter page requests to login", () => {
    const response = proxy(
      new NextRequest("http://localhost:3000/jobs/new?draft=1"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/login?next=%2Fjobs%2Fnew%3Fdraft%3D1",
    );
  });

  it("returns 401 for unauthenticated recruiter API requests", async () => {
    const response = proxy(
      new NextRequest("http://localhost:3000/api/recruiter/jobs", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Authentication required.",
    });
  });
});

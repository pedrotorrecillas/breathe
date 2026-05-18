import { describe, expect, it } from "vitest";

import { GET } from "@/app/route";

describe("root smoke", () => {
  it("serves the Nacar landing shell", async () => {
    const response = await GET();
    const html = await response.text();

    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("AI agents for faster");
    expect(html).toContain("high‑volume");
    expect(html).toContain("href=\"/privacy\"");
    expect(html).toContain("href=\"/terms\"");
    expect(html).toContain("REAL PRODUCT WALK‑THROUGH");
    expect(html).toContain("calendar.google.com/calendar/appointments/schedules");
    expect(html).toContain("data-calendar-cta");
  });
});

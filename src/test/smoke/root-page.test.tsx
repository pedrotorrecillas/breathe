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
    expect(html).not.toContain("REAL PRODUCT WALK‑THROUGH");
    expect(html).toContain("Candidates are reached too late.");
    expect(html).not.toContain("Enterprise‑ready AI hiring infrastructure.");
    expect(html).toContain("/nacar-site/assets/industry-motion/retail.mp4");
    expect(html).toContain("/nacar-site/assets/industry-motion/logistics-poster.jpg");
    expect(html).not.toContain("/nacar-site/assets/ind-retail.png");
    expect(html).toContain("calendar.google.com/calendar/appointments/schedules");
    expect(html).toContain("data-calendar-cta");
  });
});

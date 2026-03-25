import { describe, expect, it } from "vitest";

import { getOperationalStateLabel } from "@/lib/job-pipeline";

describe("job pipeline labels", () => {
  it("maps operational states into recruiter-friendly labels", () => {
    expect(getOperationalStateLabel("pending")).toBe("Awaiting call");
    expect(getOperationalStateLabel("calling")).toBe("Calling now");
    expect(getOperationalStateLabel("completed")).toBe("Interview complete");
    expect(getOperationalStateLabel("human_requested")).toBe("Human requested");
    expect(getOperationalStateLabel("no_response")).toBe("No response yet");
  });
});

import { describe, expect, it } from "vitest";

import {
  applyRecruiterAction,
  getJobPipelineSnapshot,
  getOperationalStateLabel,
} from "@/lib/job-pipeline";

describe("job pipeline labels", () => {
  it("maps operational states into recruiter-friendly labels", () => {
    expect(getOperationalStateLabel("pending")).toBe("Awaiting call");
    expect(getOperationalStateLabel("calling")).toBe("Calling now");
    expect(getOperationalStateLabel("completed")).toBe("Interview complete");
    expect(getOperationalStateLabel("human_requested")).toBe("Human requested");
    expect(getOperationalStateLabel("no_response")).toBe("No response yet");
  });

  it("applies shortlist and reject transitions explicitly", () => {
    const snapshot = getJobPipelineSnapshot("warehouse-associate-madrid");

    expect(snapshot).not.toBeNull();

    const shortlisted = applyRecruiterAction(
      snapshot!.candidates,
      "cand_tomas_vidal",
      "shortlist",
    );
    const rejected = applyRecruiterAction(
      shortlisted,
      "cand_daniel_ruiz",
      "reject",
    );

    expect(
      shortlisted.find((candidate) => candidate.id === "cand_tomas_vidal")?.stage,
    ).toBe("Shortlisted");
    expect(
      rejected.find((candidate) => candidate.id === "cand_daniel_ruiz")?.stage,
    ).toBe("Rejected");
  });

  it("supports hire and reversible manual transitions", () => {
    const snapshot = getJobPipelineSnapshot("warehouse-associate-madrid");

    expect(snapshot).not.toBeNull();

    const hired = applyRecruiterAction(
      snapshot!.candidates,
      "cand_ines_gomez",
      "hire",
    );
    const movedBack = applyRecruiterAction(
      hired,
      "cand_ines_gomez",
      "move_to_shortlisted",
    );
    const restored = applyRecruiterAction(
      snapshot!.candidates,
      "cand_marta_gil",
      "restore_to_interviewed",
    );
    const rewound = applyRecruiterAction(
      snapshot!.candidates,
      "cand_omar_navarro",
      "move_to_interviewed",
    );

    expect(
      hired.find((candidate) => candidate.id === "cand_ines_gomez")?.stage,
    ).toBe("Hired");
    expect(
      movedBack.find((candidate) => candidate.id === "cand_ines_gomez")?.stage,
    ).toBe("Shortlisted");
    expect(
      restored.find((candidate) => candidate.id === "cand_marta_gil")?.stage,
    ).toBe("Interviewed");
    expect(
      rewound.find((candidate) => candidate.id === "cand_omar_navarro")?.stage,
    ).toBe("Interviewed");
  });
});

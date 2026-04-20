import { randomUUID } from "node:crypto";

import type { CandidateNote } from "@/domain/candidates/types";
import {
  loadRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

export type CandidateNotesByCandidateId = Record<
  string,
  {
    applicationId: string | null;
    jobId: string | null;
    notes: CandidateNote[];
  }
>;

type CandidateNoteAuthor = {
  userId: string | null;
  name: string | null;
};

function sortNotesChronologically(notes: CandidateNote[]) {
  return [...notes].sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt.localeCompare(right.createdAt);
    }

    return left.id.localeCompare(right.id);
  });
}

export async function listCandidateNotesByCandidateIdForJob(
  jobId: string,
  candidateIds: string[],
): Promise<CandidateNotesByCandidateId> {
  const state = await loadRuntimeStoreState();

  const entries = candidateIds.map((candidateId) => {
    const application = [...state.applications]
      .reverse()
      .find(
        (item) => item.jobId === jobId && item.candidateId === candidateId,
      );

    const notes = application
      ? sortNotesChronologically(
          state.candidateNotes.filter(
            (note) =>
              note.jobId === jobId &&
              note.candidateId === candidateId &&
              note.applicationId === application.id,
          ),
        )
      : [];

    return [
      candidateId,
      {
        applicationId: application?.id ?? null,
        jobId: application?.jobId ?? null,
        notes,
      },
    ];
  });

  return Object.fromEntries(entries);
}

export async function createCandidateNote(input: {
  candidateId: string;
  applicationId: string;
  jobId: string;
  body: string;
  author: CandidateNoteAuthor;
}): Promise<
  | { success: true; data: CandidateNote }
  | { success: false; error: string }
> {
  const state = await loadRuntimeStoreState();
  const body = input.body.trim();

  if (!body) {
    return {
      success: false,
      error: "Note body cannot be empty.",
    };
  }

  if (body.length > 2000) {
    return {
      success: false,
      error: "Note body must stay under 2000 characters.",
    };
  }

  const candidate = state.candidates.find((item) => item.id === input.candidateId);

  if (!candidate) {
    return {
      success: false,
      error: "Candidate could not be found.",
    };
  }

  const application = state.applications.find(
    (item) =>
      item.id === input.applicationId &&
      item.candidateId === input.candidateId &&
      item.jobId === input.jobId,
  );

  if (!application) {
    return {
      success: false,
      error: "Candidate application could not be found for this note.",
    };
  }

  const note: CandidateNote = {
    id: `note_${randomUUID()}`,
    companyId: application.companyId,
    candidateId: input.candidateId,
    applicationId: input.applicationId,
    jobId: input.jobId,
    body,
    createdAt: new Date().toISOString(),
    authorUserId: input.author.userId,
    authorName: input.author.name,
  };

  state.candidateNotes.push(note);
  await saveRuntimeStoreState(state);

  return {
    success: true,
    data: note,
  };
}

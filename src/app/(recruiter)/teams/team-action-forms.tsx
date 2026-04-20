"use client";

import { type ReactNode, useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  addTeamMemberAction,
  createTeamAction,
  idleTeamActionState,
  removeTeamMemberAction,
  toggleTeamJobAccessAction,
  type TeamActionState,
} from "./actions";

function ActionFeedback({ state }: { state: TeamActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <Alert variant={state.status === "success" ? "success" : "destructive"}>
      <AlertTitle>{state.status === "success" ? "Saved" : "Action failed"}</AlertTitle>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}

function SubmitButton({
  children,
  pendingLabel,
  variant = "default",
  size = "default",
}: {
  children: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "secondary" | "destructive";
  size?: "default" | "sm";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} size={size} disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

export function CreateTeamForm({ children }: { children: ReactNode }) {
  const [state, formAction] = useActionState(createTeamAction, idleTeamActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {children}
      <SubmitButton pendingLabel="Creating...">Create team</SubmitButton>
      <ActionFeedback state={state} />
    </form>
  );
}

export function AddTeamMemberForm({ teamId }: { teamId: string }) {
  const [state, formAction] = useActionState(addTeamMemberAction, idleTeamActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="teamId" value={teamId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input name="email" type="email" placeholder="recruiter@company.com" required />
        <SubmitButton variant="outline" pendingLabel="Adding...">
          Add member
        </SubmitButton>
      </div>
      <ActionFeedback state={state} />
    </form>
  );
}

export function RemoveTeamMemberForm({
  teamId,
  userId,
}: {
  teamId: string;
  userId: string;
}) {
  const [state, formAction] = useActionState(removeTeamMemberAction, idleTeamActionState);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton variant="outline" size="sm" pendingLabel="Removing...">
        Remove
      </SubmitButton>
      <ActionFeedback state={state} />
    </form>
  );
}

export function ToggleTeamJobAccessForm({
  teamId,
  jobId,
  enabled,
}: {
  teamId: string;
  jobId: string;
  enabled: boolean;
}) {
  const [state, formAction] = useActionState(
    toggleTeamJobAccessAction,
    idleTeamActionState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="enabled" value={enabled ? "true" : "false"} />
      <SubmitButton
        variant={enabled ? "secondary" : "outline"}
        size="sm"
        pendingLabel={enabled ? "Revoking..." : "Granting..."}
      >
        {enabled ? "Revoke access" : "Grant access"}
      </SubmitButton>
      <ActionFeedback state={state} />
    </form>
  );
}

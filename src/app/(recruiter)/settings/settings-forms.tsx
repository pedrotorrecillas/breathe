"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  idleSettingsActionState,
  updateCompanyAction,
  updateProfileAction,
  type SettingsActionState,
} from "./actions";

function SettingsActionFeedback({ state }: { state: SettingsActionState }) {
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

function SaveButton({ pendingLabel }: { pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? pendingLabel : "Save changes"}
    </Button>
  );
}

export function ProfileSettingsForm({
  defaultDisplayName,
}: {
  defaultDisplayName: string;
}) {
  const [state, formAction] = useActionState(
    updateProfileAction,
    idleSettingsActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="displayName">
          Display name
        </label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={defaultDisplayName}
          required
        />
      </div>
      <SaveButton pendingLabel="Saving..." />
      <SettingsActionFeedback state={state} />
    </form>
  );
}

export function CompanySettingsForm({
  defaultCompanyName,
}: {
  defaultCompanyName: string;
}) {
  const [state, formAction] = useActionState(
    updateCompanyAction,
    idleSettingsActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="companyName">
          Company name
        </label>
        <Input
          id="companyName"
          name="companyName"
          defaultValue={defaultCompanyName}
          required
        />
      </div>
      <SaveButton pendingLabel="Saving..." />
      <SettingsActionFeedback state={state} />
    </form>
  );
}

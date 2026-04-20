"use server";

import { redirect } from "next/navigation";

import {
  DEFAULT_AUTH_REDIRECT_PATH,
  buildLoginPath,
  sanitizeRedirectTarget,
} from "@/lib/auth/constants";
import { setSessionCookie } from "@/lib/auth/server";
import { authenticateUser } from "@/lib/auth/store";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = sanitizeRedirectTarget(
    String(formData.get("next") ?? ""),
    DEFAULT_AUTH_REDIRECT_PATH,
  );

  const authenticated = await authenticateUser(email, password);

  if (!authenticated) {
    const loginPath = buildLoginPath(nextPath);
    const separator = loginPath.includes("?") ? "&" : "?";
    redirect(`${loginPath}${separator}error=invalid_credentials`);
  }

  await setSessionCookie(
    authenticated.token,
    authenticated.recruiter.session.expiresAt,
  );
  redirect(nextPath);
}

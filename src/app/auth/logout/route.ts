import { NextResponse } from "next/server";

import { resolveAuthBaseUrl } from "@/lib/auth/google";
import { signOutCurrentSession } from "@/lib/auth/server";

export async function POST(request: Request) {
  await signOutCurrentSession();

  const url = new URL("/auth/login", resolveAuthBaseUrl(new URL(request.url).origin));
  url.searchParams.set("logged_out", "1");

  return NextResponse.redirect(url);
}

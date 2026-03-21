"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithAuth0Action(formData?: FormData) {
  const redirectTo = String(formData?.get("redirectTo") ?? "/auth/post-login");
  await signIn("auth0", { redirectTo });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

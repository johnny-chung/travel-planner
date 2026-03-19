import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const getSession = cache(async () => auth());

export const requireSession = cache(async () => {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
});

export const requireUserId = cache(async () => {
  const session = await requireSession();
  return session.user.id;
});

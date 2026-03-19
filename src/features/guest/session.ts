import "server-only";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";

const GUEST_COOKIE = "rl_guest_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export async function getGuestId() {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_COOKIE)?.value ?? null;
}

export async function getOrCreateGuestId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_COOKIE)?.value;
  if (existing) {
    return existing;
  }

  const guestId = randomUUID();
  cookieStore.set(GUEST_COOKIE, guestId, buildCookieOptions());
  return guestId;
}

export async function clearGuestId() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_COOKIE);
}

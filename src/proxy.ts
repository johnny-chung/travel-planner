import { auth } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

export const protectedRoute = [
  "/trips",
  "/plans",
  "/expense",
  "/notifications",
  "/profile",
  "/upgrade",
] as const;

export async function proxy(
  request: NextRequest & { auth: { user?: unknown } | null },
) {
  const { pathname } = request.nextUrl;

  if (protectedRoute.some((route) => pathname.startsWith(route))) {
    const session = await auth();
    if (!session || new Date(session.expires).getTime() < Date.now()) {
      request.nextUrl.pathname = `/login`;
      return NextResponse.redirect(request.nextUrl);
    }
  }
  return NextResponse.next();
}

export default auth(proxy);

export const config = {
  matcher: ["/((?!api|_next|assets|favicon.ico).*)"],
};

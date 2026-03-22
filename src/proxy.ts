import { auth } from "@/auth";
import {
  addLocaleToPathname,
  defaultLocale,
  getLocaleFromPathname,
  isSupportedLocale,
  removeLocaleFromPathname,
} from "@/features/i18n/config";
import { NextResponse, type NextRequest } from "next/server";

export const protectedRoute = [
  "/trips",
  "/plans",
  "/expense",
  "/notifications",
  "/profile",
  "/upgrade",
  "/orders",
] as const;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const currentLocale = getLocaleFromPathname(pathname);
  const cookieLocale = request.cookies.get("locale")?.value;
  const resolvedCookieLocale = isSupportedLocale(cookieLocale) ? cookieLocale : null;
  const resolvedLocale = currentLocale ?? resolvedCookieLocale ?? defaultLocale;
  const cleanPathname = removeLocaleFromPathname(pathname);

  if (protectedRoute.some((route) => cleanPathname.startsWith(route))) {
    const session = await auth();
    if (!session || new Date(session.expires).getTime() < Date.now()) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = addLocaleToPathname(resolvedLocale, "/login");
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set("locale", resolvedLocale, {
        path: "/",
        sameSite: "lax",
      });
      return response;
    }
  }

  if (currentLocale) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", currentLocale);
    requestHeaders.set("x-pathname", cleanPathname);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.cookies.set("locale", currentLocale, {
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = addLocaleToPathname(resolvedLocale, pathname);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set("locale", resolvedLocale, {
    path: "/",
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|assets|favicon.ico|.*\\..*).*)"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["ar", "en"] as const;
const defaultLocale = "ar";

function getLocaleFromPathname(pathname: string): string | null {
  const segment = pathname.split("/")[1];
  return locales.includes(segment as (typeof locales)[number]) ? segment : null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameLocale = getLocaleFromPathname(pathname);

  if (!pathnameLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    const response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", defaultLocale, { path: "/" });
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", pathnameLocale);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.cookies.set("NEXT_LOCALE", pathnameLocale, { path: "/" });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

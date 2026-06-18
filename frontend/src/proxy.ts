import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_INTERNO = ["/interno/login"];
const PUBLIC_EXTERNO = ["/externo/login", "/externo/registro"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("bpm_token")?.value;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/interno/login", request.url));
  }

  if (pathname.startsWith("/interno") && !PUBLIC_INTERNO.includes(pathname)) {
    if (!token) {
      const loginUrl = new URL("/interno/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/externo") && !PUBLIC_EXTERNO.includes(pathname)) {
    if (!token) {
      const loginUrl = new URL("/externo/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png).*)"],
};

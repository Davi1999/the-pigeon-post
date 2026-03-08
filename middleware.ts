// middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isAuthRoute =
    pathname === "/sign-in" || pathname === "/sign-up";
  const isLanding = pathname === "/";

  if (isLanding) {
    return NextResponse.redirect(
      new URL(session ? "/dashboard" : "/sign-in", request.url)
    );
  }

  if (isProtectedRoute && !session) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/", "/dashboard", "/dashboard/:path*", "/sign-in", "/sign-up"],
};

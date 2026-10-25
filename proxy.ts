import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/aula\/s\/([^/]+)/);
  if (!match) return NextResponse.next();
  const token = match[1];
  const response = NextResponse.next();
  response.cookies.set("aula_student", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/aula",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: ["/aula/s/:path*"],
};

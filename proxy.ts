import { NextResponse } from "next/server";

/** Legacy matcher kept empty — student auth is cookie session, not URL token. */
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};

import { NextResponse } from "next/server";
import { RECOVERY_COOKIE } from "@/lib/auth/password";

export async function POST() {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(RECOVERY_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body.password || "");

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: "ADMIN_PASSWORD is missing in .env" },
        { status: 500 }
      );
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set(ADMIN_COOKIE_NAME, "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
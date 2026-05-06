export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

async function getPrisma() {
  const { prisma } = await import("../../../../lib/prisma");
  return prisma;
}

async function getAuth() {
  return await import("../../../../lib/auth");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const prisma = await getPrisma();
    const { createCustomerToken } = await getAuth();

    const body = await request.json();

    const email = normalizeEmail(String(body.email || ""));
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const userWithPassword = await prisma.user.findUnique({
      where: { email },
    });

    if (!userWithPassword || !userWithPassword.isActive) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(
      password,
      userWithPassword.passwordHash
    );

    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const user = {
      id: userWithPassword.id,
      name: userWithPassword.name,
      email: userWithPassword.email,
      phone: userWithPassword.phone,
      role: userWithPassword.role,
    };

    const token = await createCustomerToken(user);

    const response = NextResponse.json({ success: true, user });

    response.cookies.set("sinet_customer_auth", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Login failed." },
      { status: 500 }
    );
  }
}
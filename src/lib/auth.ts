import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const CUSTOMER_COOKIE = "sinet_customer_auth";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "change-this-secret-before-production"
);

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

export async function createCustomerToken(user: AuthUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function getCurrentUser() {
  try {
    const token = cookies().get(CUSTOMER_COOKIE)?.value;

    if (!token) return null;

    const verified = await jwtVerify(token, secret);
    const payload = verified.payload as AuthUser;

    const user = await prisma.user.findFirst({
      where: {
        id: payload.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export function setCustomerAuthCookie(token: string) {
  cookies().set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearCustomerAuthCookie() {
  cookies().delete(CUSTOMER_COOKIE);
}
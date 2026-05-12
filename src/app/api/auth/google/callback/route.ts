export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

async function getPrisma() {
  const { prisma } = await import("../../../../../lib/prisma");
  return prisma;
}

async function getAuth() {
  return await import("../../../../../lib/auth");
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function getRedirectUri() {
  return (
    process.env.GOOGLE_AUTH_REDIRECT_URI ||
    `${getBaseUrl()}/api/auth/google/callback`
  );
}

function decodeState(state: string) {
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));

    return {
      next: typeof parsed.next === "string" ? parsed.next : "/account",
      createdAt: Number(parsed.createdAt || 0),
    };
  } catch {
    return {
      next: "/account",
      createdAt: 0,
    };
  }
}

function safeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const error = url.searchParams.get("error") || "";

  const storedState =
    request.headers
      .get("cookie")
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("sinet_google_oauth_state="))
      ?.split("=")[1] || "";

  if (error) {
    return NextResponse.redirect(`${getBaseUrl()}/login?error=google_cancelled`);
  }

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${getBaseUrl()}/login?error=google_state`);
  }

  const decodedState = decodeState(state);
  const next = safeNextPath(decodedState.next);

  if (!decodedState.createdAt || Date.now() - decodedState.createdAt > 10 * 60 * 1000) {
    return NextResponse.redirect(`${getBaseUrl()}/login?error=google_expired`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${getBaseUrl()}/login?error=google_config`);
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getRedirectUri(),
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

    if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
      console.error("Google token error:", tokenData);
      return NextResponse.redirect(`${getBaseUrl()}/login?error=google_token`);
    }

    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const googleUser = (await userInfoResponse.json()) as GoogleUserInfo;

    if (
      !userInfoResponse.ok ||
      !googleUser.sub ||
      !googleUser.email ||
      googleUser.email_verified === false
    ) {
      console.error("Google userinfo error:", googleUser);
      return NextResponse.redirect(`${getBaseUrl()}/login?error=google_profile`);
    }

    const prisma = await getPrisma();
    const { createCustomerToken } = await getAuth();

    const email = googleUser.email.trim().toLowerCase();

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: googleUser.name || email.split("@")[0],
        googleId: googleUser.sub,
        image: googleUser.picture || null,
        authProvider: "google",
        isActive: true,
      },
      create: {
        name: googleUser.name || email.split("@")[0],
        email,
        phone: "",
        passwordHash: null,
        googleId: googleUser.sub,
        image: googleUser.picture || null,
        authProvider: "google",
        role: "customer",
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

    const token = await createCustomerToken(user);

    const response = NextResponse.redirect(`${getBaseUrl()}${next}`);

    response.cookies.set("sinet_customer_auth", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    response.cookies.set("sinet_google_oauth_state", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(`${getBaseUrl()}/login?error=google_failed`);
  }
}
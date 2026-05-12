export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function getRedirectUri() {
  return (
    process.env.GOOGLE_AUTH_REDIRECT_URI ||
    `${getBaseUrl()}/api/auth/google/callback`
  );
}

function createState(next: string) {
  const payload = {
    next,
    nonce: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";

  if (!clientId) {
    return NextResponse.json(
      { success: false, message: "Missing GOOGLE_CLIENT_ID." },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/account";
  const state = createState(next);

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", getRedirectUri());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl.toString());

  response.cookies.set("sinet_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
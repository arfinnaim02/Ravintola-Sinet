import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "sinet_admin_auth";

export function isAdminAuthenticated() {
  const cookieStore = cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === "true";
}
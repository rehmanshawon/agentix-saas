import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "agentix_admin_session";
const SESSION_DURATION_SECONDS = 12 * 60 * 60;

function getSessionSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET;
}

export function createAdminSessionToken(): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const signature = createHmac("sha256", secret)
    .update(String(expiresAt))
    .digest("hex");

  return `${expiresAt}.${signature}`;
}

export function isValidAdminSessionToken(token?: string): boolean {
  const secret = getSessionSecret();
  if (!secret || !token) return false;

  const [expiresAt, suppliedSignature, ...extra] = token.split(".");
  if (
    extra.length > 0 ||
    !/^\d+$/.test(expiresAt || "") ||
    !suppliedSignature ||
    Number(expiresAt) <= Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(expiresAt)
    .digest();
  const actualSignature = Buffer.from(suppliedSignature, "hex");

  return (
    actualSignature.length === expectedSignature.length &&
    timingSafeEqual(expectedSignature, actualSignature)
  );
}

export function getAdminSessionDurationSeconds(): number {
  return SESSION_DURATION_SECONDS;
}

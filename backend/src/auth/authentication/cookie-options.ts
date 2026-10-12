import type { CookieOptions } from "express";

/*
 * The frontend (S3 + CloudFront) and backend (Render) live on different
 * origins, so the auth cookies are cross-site. Browsers only send cross-site
 * cookies when `sameSite: "none"` and `secure: true` (HTTPS), which both
 * CloudFront and Render provide. Locally we stay on `lax`/insecure so
 * development over http://localhost keeps working.
 */
const isProduction = process.env.NODE_ENV === "production";

export function authCookieOptions(path: string): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path,
  };
}

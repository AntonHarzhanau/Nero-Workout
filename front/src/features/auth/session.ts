import "server-only";

import { cookies } from "next/headers";
import type { TokenPair } from "./contracts";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function saveSession(tokens: TokenPair): Promise<void> {
  const store = await cookies();

  store.set(ACCESS_COOKIE, tokens.accessToken, {
    ...cookieOptions,
    maxAge: tokens.expiresIn,
  });

  store.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_MAX_AGE,
  });
}

export async function readSession() {
  const store = await cookies();

  return {
    accessToken: store.get(ACCESS_COOKIE)?.value,
    refreshToken: store.get(REFRESH_COOKIE)?.value,
  };
}

export async function clearSession(): Promise<void> {
  const store = await cookies();

  store.set(ACCESS_COOKIE, "", {
    ...cookieOptions,
    maxAge: 0,
  });

  store.set(REFRESH_COOKIE, "", {
    ...cookieOptions,
    maxAge: 0,
  });
}

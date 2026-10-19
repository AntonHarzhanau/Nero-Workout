import "server-only";

import { z } from "zod";
import { createApiClient } from "@/lib/http/api-client";
import { tokenPairSchema, userSchema } from "./contracts";
import type { LoginInput, RegisterInput } from "./schemas";

const request = createApiClient(() => process.env.ACCOUNT_API_URL);

export const authApi = {
  login(input: LoginInput) {
    return request("/auth/login", tokenPairSchema, {
      method: "POST",
      body: input,
    });
  },

  register(input: RegisterInput) {
    return request("/auth/register", userSchema, {
      method: "POST",
      body: input,
    });
  },

  getMe(accessToken: string) {
    return request("/users/me", userSchema, {
      token: accessToken,
    });
  },

  logout(refreshToken: string) {
    return request("/auth/logout", z.void(), {
      method: "POST",
      body: { refreshToken },
    });
  },

  deleteMe(accessToken: string) {
    return request("/users/me", z.void(), {
      method: "DELETE",
      token: accessToken,
      timeoutMs: 10_000,
    });
  },
};

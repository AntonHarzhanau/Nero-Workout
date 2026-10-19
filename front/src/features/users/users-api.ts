import "server-only";

import { z } from "zod";
import { createApiClient } from "@/lib/http/api-client";
import { usersListSchema } from "./contracts";

const request = createApiClient(() => process.env.ACCOUNT_API_URL);

export const usersApi = {
  list(accessToken: string) {
    return request("/admin/users", usersListSchema, {
      token: accessToken,
    });
  },

  delete(userId: string, accessToken: string) {
    return request(`/admin/users/${encodeURIComponent(userId)}`, z.void(), {
      method: "DELETE",
      token: accessToken,
      timeoutMs: 10_000,
    });
  },
};

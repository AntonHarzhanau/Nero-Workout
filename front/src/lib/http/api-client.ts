import "server-only";

import { z } from "zod";

export type ApiError = {
  message: string;
  status?: number;
  code?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  timeoutMs?: number;
};

const errorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z
    .record(
      z.string(),
      z.string().transform((message) => [message]),
    )
    .optional(),
});

export function createApiClient(getBaseUrl: () => string | undefined) {
  return async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    options: RequestOptions = {},
  ): Promise<ApiResult<T>> {
    const baseUrl = getBaseUrl();

    if (!baseUrl) {
      return {
        ok: false,
        error: { message: "Le service n’est pas configuré." },
      };
    }

    const headers = new Headers({
      Accept: "application/json",
    });

    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    if (options.token) {
      headers.set("Authorization", `Bearer ${options.token}`);
    }

    let response: Response;

    try {
      response = await fetch(new URL(path, baseUrl), {
        method: options.method ?? "GET",
        headers,
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
        cache: "no-store",
        signal: AbortSignal.timeout(options.timeoutMs ?? 5_000),
      });
    } catch {
      return {
        ok: false,
        error: {
          message: "Impossible de contacter le serveur.",
        },
      };
    }

    if (response.status >= 500) {
      return {
        ok: false,
        error: {
          status: response.status,
          message: "Le service est temporairement indisponible.",
        },
      };
    }

    let body: unknown;

    try {
      body = response.status === 204 ? undefined : await response.json();
    } catch {
      return {
        ok: false,
        error: {
          status: response.status,
          message: "Le serveur a renvoyé une réponse inattendue.",
        },
      };
    }

    if (!response.ok) {
      const parsed = errorSchema.safeParse(body);

      return {
        ok: false,
        error: {
          status: response.status,
          code: parsed.success ? parsed.data.error : undefined,
          message: parsed.success
            ? parsed.data.message
            : "La requête a échoué.",
          fieldErrors: parsed.success ? parsed.data.details : undefined,
        },
      };
    }

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return {
        ok: false,
        error: {
          status: response.status,
          message: "Le serveur a renvoyé des données invalides.",
        },
      };
    }

    return { ok: true, data: parsed.data };
  };
}

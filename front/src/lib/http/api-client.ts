import "server-only";

import { z } from "zod";

export type ApiError = {
  message: string;
  status?: number;
  code?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type ActionError = Pick<ApiError, "message" | "fieldErrors">;

export type ApiResult<T> =
  { ok: true; data: T } | { ok: false; error: ApiError };

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  timeoutMs?: number;
};

const errorSchema = z.object({
  error: z.string().optional(),
  message: z.union([z.string(), z.array(z.string())]).optional(),
  details: z
    .record(
      z.string(),
      z.union([
        z.string().transform((message) => [message]),
        z.array(z.string()),
      ]),
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
        error: {
          message: "Le service n’est pas configuré.",
        },
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
    let responseText: string;

    try {
      response = await fetch(new URL(path, baseUrl), {
        method: options.method ?? "GET",
        headers,
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
        cache: "no-store",
        signal: AbortSignal.timeout(options.timeoutMs ?? 5_000),
      });

      responseText = await response.text();
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

    let body: unknown = undefined;

    if (responseText.trim()) {
      try {
        body = JSON.parse(responseText);
      } catch {
        return {
          ok: false,
          error: {
            status: response.status,
            message: "Le serveur a renvoyé une réponse inattendue.",
          },
        };
      }
    }

    if (!response.ok) {
      const parsed = errorSchema.safeParse(body);
      const error = parsed.success ? parsed.data : undefined;

      const message = Array.isArray(error?.message)
        ? error.message.join(" ")
        : error?.message;

      return {
        ok: false,
        error: {
          status: response.status,
          code: error?.error,
          message: message || "La requête a échoué.",
          fieldErrors: error?.details,
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

    return {
      ok: true,
      data: parsed.data,
    };
  };
}

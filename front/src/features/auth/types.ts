import type { ApiError } from "@/lib/http/api-client";

export type ActionError = Pick<ApiError, "message" | "fieldErrors">;

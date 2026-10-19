import type { ApiError } from "./api-client";
export const sessionError: ApiError = {
  status: 401,
  message: "Votre session a expiré. Reconnectez-vous.",
};
export function mutationError(
  error: ApiError,
  notFoundMessage: string,
): ApiError {
  switch (error.status) {
    case 401:
      return sessionError;
    case 403:
      return {
        ...error,
        message: "Vous n’avez pas l’autorisation d’effectuer cette opération.",
      };
    case 404:
      return { ...error, message: notFoundMessage };
    default:
      return error;
  }
}

const DEFAULT_RETURN_TO = "/dashboard";
const LOCAL_ORIGIN = "https://nero.local";

export function getSafeReturnTo(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  ) {
    return DEFAULT_RETURN_TO;
  }

  try {
    const url = new URL(value, LOCAL_ORIGIN);

    if (url.origin !== LOCAL_ORIGIN) {
      return DEFAULT_RETURN_TO;
    }

    const blockedPaths = ["/login", "/register", "/api", "/_next"];

    const isBlocked = blockedPaths.some(
      (path) => url.pathname === path || url.pathname.startsWith(`${path}/`),
    );

    if (isBlocked) {
      return DEFAULT_RETURN_TO;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return DEFAULT_RETURN_TO;
  }
}

export function getLoginUrl(returnTo: unknown): string {
  const params = new URLSearchParams({
    next: getSafeReturnTo(returnTo),
  });

  return `/login?${params}`;
}

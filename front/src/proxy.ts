import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  const url = request.nextUrl.clone();

  url.searchParams.delete("_rsc");

  headers.set("x-nero-path", `${url.pathname}${url.search}`);

  return NextResponse.next({
    request: { headers },
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

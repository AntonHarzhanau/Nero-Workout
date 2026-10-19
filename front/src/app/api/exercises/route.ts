import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/features/auth/session";
import { exercisesApi } from "@/features/exercises/exercises-api";
import { readExercisesQuery } from "@/features/exercises/query";
import { sessionError } from "@/lib/http/mutation-error";

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  const { accessToken } = await readSession();
  if (!accessToken)
    return NextResponse.json(
      { ok: false, error: sessionError },
      { status: 401, headers },
    );
  const query = readExercisesQuery(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  const result = await exercisesApi.list(query, accessToken);
  return NextResponse.json(result, {
    status: result.ok ? 200 : (result.error.status ?? 503),
    headers,
  });
}

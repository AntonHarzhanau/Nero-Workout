import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/features/auth/session";
import { plansApi } from "@/features/plans/plans-api";
import { sessionError } from "@/lib/http/mutation-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = { "Cache-Control": "private, no-store" };
  const { accessToken } = await readSession();
  if (!accessToken)
    return NextResponse.json(
      { ok: false, error: sessionError },
      { status: 401, headers },
    );
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return NextResponse.json(
      { ok: false, error: { message: "Identifiant du plan invalide." } },
      { status: 400, headers },
    );
  const result = await plansApi.get(id, accessToken);
  return NextResponse.json(result, {
    status: result.ok ? 200 : (result.error.status ?? 503),
    headers,
  });
}

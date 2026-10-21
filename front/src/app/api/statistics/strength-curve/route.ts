import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/features/auth/session";
import { statisticsApi } from "@/features/statistics/statistics-api";

const querySchema = z
  .object({ exerciseId: z.uuid(), from: z.iso.date(), to: z.iso.date() })
  .refine((query) => query.from <= query.to, "Période invalide.");

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const { accessToken } = await readSession();
  if (!accessToken)
    return NextResponse.json(
      { ok: false, error: { message: "Votre session a expiré." } },
      { status: 401, headers },
    );
  const query = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!query.success)
    return NextResponse.json(
      { ok: false, error: { message: "Exercice ou période invalide." } },
      { status: 422, headers },
    );
  const result = await statisticsApi.strengthCurve(
    query.data.exerciseId,
    accessToken,
    query.data,
  );
  return NextResponse.json(result, {
    status: result.ok ? 200 : (result.error.status ?? 503),
    headers,
  });
}

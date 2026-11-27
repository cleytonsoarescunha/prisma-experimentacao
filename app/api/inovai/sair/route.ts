// Sai da área do time: apaga o cookie da sessão.

import { cookies } from "next/headers";
import { COOKIE_SESSAO } from "@/lib/equipe";

export async function POST() {
  (await cookies()).set(COOKIE_SESSAO, "", { path: "/", maxAge: 0 });
  return Response.json({ ok: true });
}

// Clique no botão "Entrar na área restrita": confere o código do link (vale uma vez),
// guarda a sessão e leva para a área do time.

import { cookies } from "next/headers";
import { COOKIE_SESSAO, conferirTokenDeAcesso, criarValorSessao, ehDoTime } from "@/lib/equipe";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const dados = await request.formData().catch(() => null);
  const token = dados?.get("token");
  const email = typeof token === "string" && token ? await conferirTokenDeAcesso(token) : null;

  if (!email || !ehDoTime(email)) {
    return Response.redirect(new URL("/inovai/entrar?erro=link", url.origin), 303);
  }

  const { valor, maxAge } = criarValorSessao(email);
  (await cookies()).set(COOKIE_SESSAO, valor, {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: "/",
    maxAge,
  });
  return Response.redirect(new URL("/inovai", url.origin), 303);
}

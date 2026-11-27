// Acesso do time InovAI: lista de e-mails autorizados, link de acesso e sessão (cookie assinado).
// O link de acesso é criado pelo Supabase Auth (vale uma vez, por pouco tempo) e enviado pelo Gmail do Prisma.
// Depois que a pessoa clica, o Prisma guarda um cookie assinado com o e-mail dela, válido por 7 dias.

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServidor } from "./supabase-servidor";

export const COOKIE_SESSAO = "prisma_inovai";
const DURACAO_SEGUNDOS = 7 * 24 * 60 * 60;

/** E-mails do time InovAI (INOVAI_EMAILS no .env.local, separados por vírgula). */
export function emailsDoTime(): string[] {
  return (process.env.INOVAI_EMAILS || "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const ehDoTime = (email: string) => emailsDoTime().includes(email.trim().toLowerCase());

function assinatura(conteudo: string): string {
  const base = process.env.SUPABASE_SECRET_KEY;
  if (!base) throw new Error("SUPABASE_SECRET_KEY não configurada");
  return createHmac("sha256", "prisma-sessao:" + base).update(conteudo).digest("base64url");
}

/** Valor do cookie: e-mail e validade, com assinatura para ninguém conseguir forjar. */
export function criarValorSessao(email: string): { valor: string; maxAge: number } {
  const ate = Math.floor(Date.now() / 1000) + DURACAO_SEGUNDOS;
  const conteudo = Buffer.from(JSON.stringify({ e: email.toLowerCase(), ate })).toString("base64url");
  return { valor: conteudo + "." + assinatura(conteudo), maxAge: DURACAO_SEGUNDOS };
}

function lerValorSessao(valor: string | undefined): string | null {
  if (!valor) return null;
  const [conteudo, assinado] = valor.split(".");
  if (!conteudo || !assinado) return null;
  const esperado = Buffer.from(assinatura(conteudo));
  const veio = Buffer.from(assinado);
  if (esperado.length !== veio.length || !timingSafeEqual(esperado, veio)) return null;
  try {
    const { e, ate } = JSON.parse(Buffer.from(conteudo, "base64url").toString());
    if (typeof e !== "string" || typeof ate !== "number" || ate < Date.now() / 1000) return null;
    return e;
  } catch {
    return null;
  }
}

/** E-mail de quem está conectado na área do time, ou null. Confere de novo se a pessoa ainda está na lista. */
export async function usuarioDoTime(): Promise<string | null> {
  // A sessão é sempre da visita atual: nada disto pode ser preparado com antecedência pelo Next.
  await connection();
  const email = lerValorSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  return email && ehDoTime(email) ? email : null;
}

/** Cria (pelo Supabase Auth) o código de uso único que vai no link de acesso. */
export async function gerarTokenDeAcesso(email: string): Promise<string> {
  const admin = supabaseServidor().auth.admin;
  let resultado = await admin.generateLink({ type: "magiclink", email });
  if (resultado.error) {
    // Primeira vez desta pessoa: cria o usuário (já confirmado) e tenta de novo.
    await admin.createUser({ email, email_confirm: true });
    resultado = await admin.generateLink({ type: "magiclink", email });
  }
  if (resultado.error || !resultado.data.properties?.hashed_token) {
    throw new Error("Não foi possível gerar o link: " + (resultado.error?.message || "sem token"));
  }
  return resultado.data.properties.hashed_token;
}

/** Confere o código do link (vale uma vez) e devolve o e-mail da pessoa, ou null se for inválido ou vencido. */
export async function conferirTokenDeAcesso(tokenHash: string): Promise<string | null> {
  // Cliente separado: confirmar o link abre uma sessão, e ela não pode se misturar com o cliente do servidor.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !chave) return null;
  const avulso = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await avulso.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (error || !data.user?.email) return null;
  return data.user.email.toLowerCase();
}

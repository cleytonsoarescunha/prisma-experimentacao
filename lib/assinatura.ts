// Assinatura curta que prova que um link de PDF foi gerado pelo próprio servidor.
// Sem ela, qualquer pessoa que adivinhasse um código (eles são sequenciais) poderia baixar o canvas de outra.

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function segredo(): string {
  const base = process.env.SUPABASE_SECRET_KEY;
  if (!base) throw new Error("SUPABASE_SECRET_KEY não configurada");
  return "prisma-pdf:" + base;
}

/** Gera a assinatura do código da demanda. */
export function assinar(codigo: string): string {
  return createHmac("sha256", segredo()).update(codigo).digest("base64url").slice(0, 32);
}

/** Confere se a assinatura recebida é a do código. */
export function assinaturaValida(codigo: string, recebida: string | null | undefined): boolean {
  if (!recebida) return false;
  const esperada = Buffer.from(assinar(codigo));
  const veio = Buffer.from(recebida);
  return esperada.length === veio.length && timingSafeEqual(esperada, veio);
}

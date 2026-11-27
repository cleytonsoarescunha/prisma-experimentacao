// Depois de mandar os anexos direto para o Storage, o navegador confirma aqui quais chegaram.
// Precisa da assinatura devolvida no envio da demanda. O servidor confere no Storage o que existe de fato.

import { assinaturaValida } from "@/lib/assinatura";
import { PASTA_ANEXOS, supabaseServidor } from "@/lib/supabase-servidor";

export async function POST(request: Request, ctx: RouteContext<"/api/demandas/[codigo]/anexos">) {
  const { codigo: bruto } = await ctx.params;
  const codigo = decodeURIComponent(bruto).trim().toUpperCase();
  const corpo = await request.json().catch(() => ({}));
  if (!/^PR-\d{4}-\d{4,}$/.test(codigo) || !assinaturaValida(codigo, typeof corpo.t === "string" ? corpo.t : null)) {
    return Response.json({ erro: "Não autorizado." }, { status: 403 });
  }

  const supabase = supabaseServidor();
  const { data: arquivos, error } = await supabase.storage.from(PASTA_ANEXOS).list(codigo, { limit: 100 });
  if (error) return Response.json({ erro: "Não foi possível conferir os anexos." }, { status: 500 });

  // Tudo o que está na pasta da demanda, menos o PDF do canvas.
  const caminhos = (arquivos || [])
    .map((a) => `${codigo}/${a.name}`)
    .filter((c) => c !== `${codigo}/${codigo}.pdf`)
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  const { error: e } = await supabase.from("demandas").update({ anexos: caminhos }).eq("codigo", codigo);
  if (e) return Response.json({ erro: "Não foi possível registrar os anexos." }, { status: 500 });
  return Response.json({ ok: true, anexos: caminhos.length });
}

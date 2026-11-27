// Muda a situação de uma demanda (passo do pedido ou etapa da esteira) e registra no histórico. Só para o time InovAI.

import { usuarioDoTime } from "@/lib/equipe";
import { supabaseServidor } from "@/lib/supabase-servidor";
import { SITUACOES_DEMANDA } from "@/lib/tipos";

export async function POST(request: Request, ctx: RouteContext<"/api/inovai/demandas/[codigo]/situacao">) {
  const email = await usuarioDoTime();
  if (!email) return Response.json({ erro: "Sua sessão expirou. Entre de novo." }, { status: 401 });

  const { codigo: bruto } = await ctx.params;
  const codigo = decodeURIComponent(bruto).toUpperCase();
  const corpo = await request.json().catch(() => ({}));
  const situacao = typeof corpo.situacao === "string" ? corpo.situacao : "";
  if (!SITUACOES_DEMANDA.includes(situacao)) return Response.json({ erro: "Situação inválida." }, { status: 400 });

  const supabase = supabaseServidor();
  const { data: demanda, error } = await supabase.from("demandas").select("id, etapa").eq("codigo", codigo).maybeSingle();
  if (error) return Response.json({ erro: "Não foi possível salvar agora." }, { status: 500 });
  if (!demanda) return Response.json({ erro: "Demanda não encontrada." }, { status: 404 });
  if (demanda.etapa === situacao) return Response.json({ ok: true });

  const { error: e1 } = await supabase.from("demandas").update({ etapa: situacao }).eq("id", demanda.id);
  if (e1) {
    console.error("[situacao] erro ao atualizar:", e1.message);
    return Response.json({ erro: "Não foi possível salvar agora." }, { status: 500 });
  }
  const { error: e2 } = await supabase.from("historico_etapas").insert({ demanda_id: demanda.id, etapa: situacao, alterado_por: email });
  if (e2) console.error("[situacao] erro ao registrar histórico:", e2.message);
  return Response.json({ ok: true });
}

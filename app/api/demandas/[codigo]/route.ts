// Consulta pública pelo código: devolve só o código, o passo do pedido e a etapa na esteira (nenhum dado pessoal).

import { ConfiguracaoFaltando, supabaseServidor } from "@/lib/supabase-servidor";
import { posicaoDemanda } from "@/lib/tipos";

export async function GET(_req: Request, ctx: RouteContext<"/api/demandas/[codigo]">) {
  const { codigo: bruto } = await ctx.params;
  const codigo = decodeURIComponent(bruto).trim().toUpperCase();
  if (!/^PR-\d{4}-\d{4,}$/.test(codigo)) return Response.json({ erro: "Código em formato inválido." }, { status: 400 });

  let supabase;
  try {
    supabase = supabaseServidor();
  } catch (e) {
    if (e instanceof ConfiguracaoFaltando) return Response.json({ erro: "O banco de dados ainda não está configurado." }, { status: 503 });
    throw e;
  }

  const { data, error } = await supabase.from("demandas").select("codigo, etapa").eq("codigo", codigo).maybeSingle();
  if (error) {
    console.error("Erro na consulta:", error);
    return Response.json({ erro: "Não foi possível consultar agora." }, { status: 500 });
  }
  if (!data) return Response.json({ erro: "Código não encontrado." }, { status: 404 });

  const { passo, esteira } = posicaoDemanda(data.etapa);
  return Response.json({ codigo: data.codigo, etapa: data.etapa, passo, esteira });
}

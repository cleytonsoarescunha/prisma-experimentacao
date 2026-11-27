// Baixa o PDF do canvas. Precisa da assinatura (?t=...) que o servidor devolveu no envio:
// os códigos são sequenciais, e sem ela qualquer pessoa poderia baixar o canvas de outra.

import { assinaturaValida } from "@/lib/assinatura";
import { buscarDemanda } from "@/lib/demanda-banco";
import { caminhoPdf, gerarEGuardarPdf } from "@/lib/pdf";
import { ConfiguracaoFaltando, PASTA_ANEXOS, supabaseServidor } from "@/lib/supabase-servidor";

export async function GET(request: Request, ctx: RouteContext<"/api/demandas/[codigo]/pdf">) {
  const { codigo: bruto } = await ctx.params;
  const codigo = decodeURIComponent(bruto).trim().toUpperCase();
  const t = new URL(request.url).searchParams.get("t");
  if (!/^PR-\d{4}-\d{4,}$/.test(codigo) || !assinaturaValida(codigo, t)) {
    return Response.json({ erro: "Link inválido para este PDF." }, { status: 403 });
  }

  let supabase;
  try {
    supabase = supabaseServidor();
  } catch (e) {
    if (e instanceof ConfiguracaoFaltando) return Response.json({ erro: "O banco de dados ainda não está configurado." }, { status: 503 });
    throw e;
  }

  const demanda = await buscarDemanda(codigo);
  if (!demanda) return Response.json({ erro: "Código não encontrado." }, { status: 404 });

  // Usa o PDF guardado; se não houver (ou o Storage falhar), gera de novo.
  let pdf: Buffer | null = null;
  const { data } = await supabase.storage.from(PASTA_ANEXOS).download(demanda.pdfCanvas || caminhoPdf(codigo));
  if (data) pdf = Buffer.from(await data.arrayBuffer());
  if (!pdf) pdf = await gerarEGuardarPdf(codigo, new URL(request.url).origin);
  if (!pdf) return Response.json({ erro: "Não foi possível gerar o PDF agora. Tente de novo em instantes." }, { status: 500 });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${codigo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

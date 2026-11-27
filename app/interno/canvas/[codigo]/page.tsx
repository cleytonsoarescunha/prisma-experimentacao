// Página interna, usada só pelo servidor para desenhar o canvas e gerar o PDF.
// Precisa da assinatura (?t=...) que só o servidor sabe gerar; sem ela, responde "não encontrado".

import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CanvasPdf } from "@/components/Canvas";
import { assinaturaValida } from "@/lib/assinatura";
import { buscarDemanda } from "@/lib/demanda-banco";
import { montarCanvas } from "@/lib/regras";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page(props: PageProps<"/interno/canvas/[codigo]">) {
  return (
    <Suspense fallback={null}>
      <Conteudo {...props} />
    </Suspense>
  );
}

async function Conteudo({ params, searchParams }: PageProps<"/interno/canvas/[codigo]">) {
  const { codigo: bruto } = await params;
  const { t } = await searchParams;
  const codigo = decodeURIComponent(bruto).toUpperCase();
  if (!/^PR-\d{4}-\d{4,}$/.test(codigo) || !assinaturaValida(codigo, typeof t === "string" ? t : null)) notFound();

  const demanda = await buscarDemanda(codigo);
  if (!demanda) notFound();

  return (
    <div style={{ width: 1920, height: 1080, background: "#ffffff" }}>
      <CanvasPdf d={montarCanvas(demanda.form, demanda.itens)} />
    </div>
  );
}

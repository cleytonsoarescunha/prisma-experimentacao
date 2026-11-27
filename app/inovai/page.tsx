import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ListaDemandas, MolduraTime, type LinhaDemanda } from "@/components/AreaTime";
import { usuarioDoTime } from "@/lib/equipe";
import { supabaseServidor } from "@/lib/supabase-servidor";

export const metadata: Metadata = { title: "Demandas · Área do time InovAI", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={<MolduraTime>{null}</MolduraTime>}>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  const email = await usuarioDoTime();
  if (!email) redirect("/inovai/entrar");

  const { data, error } = await supabaseServidor()
    .from("demandas")
    .select("codigo, enviado_em, nome_solucao, nome, area, produto, etapa")
    .order("enviado_em", { ascending: false });

  const linhas: LinhaDemanda[] = (data || []).map((d) => ({
    codigo: d.codigo,
    enviadoEm: d.enviado_em,
    nomeSolucao: d.nome_solucao,
    nome: d.nome,
    area: d.area,
    produto: d.produto,
    situacao: d.etapa,
  }));

  return (
    <MolduraTime email={email}>
      {error ? <p role="alert">Não foi possível carregar as demandas agora. Tente recarregar a página.</p> : <ListaDemandas linhas={linhas} />}
    </MolduraTime>
  );
}

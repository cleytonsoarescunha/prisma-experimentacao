import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { MolduraTime, MudarSituacao } from "@/components/AreaTime";
import { CanvasTela } from "@/components/Canvas";
import { COR } from "@/components/ui";
import BotaoPdf from "@/components/BotaoPdf";
import { buscarDemanda } from "@/lib/demanda-banco";
import { usuarioDoTime } from "@/lib/equipe";
import { montarCanvas } from "@/lib/regras";
import { descreverSituacao } from "@/lib/tipos";
import { PASTA_ANEXOS, supabaseServidor } from "@/lib/supabase-servidor";

export const metadata: Metadata = { title: "Demanda · Área do time InovAI", robots: { index: false, follow: false } };

export default function Page(props: PageProps<"/inovai/[codigo]">) {
  return (
    <Suspense fallback={<MolduraTime>{null}</MolduraTime>}>
      <Conteudo {...props} />
    </Suspense>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section style={{ background: "#ffffff", border: `1px solid ${COR.linhas}`, borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 18, lineHeight: "24px" }}>{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: COR.suave }}>{rotulo.toUpperCase()}</span>
      <span style={{ fontSize: 15, lineHeight: "22px", whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{valor || "-"}</span>
    </div>
  );
}

async function Conteudo({ params }: PageProps<"/inovai/[codigo]">) {
  const email = await usuarioDoTime();
  if (!email) redirect("/inovai/entrar");

  const codigo = decodeURIComponent((await params).codigo).toUpperCase();
  if (!/^PR-\d{4}-\d{4,}$/.test(codigo)) notFound();
  const demanda = await buscarDemanda(codigo);
  if (!demanda) notFound();

  const supabase = supabaseServidor();
  const { data: extra } = await supabase.from("demandas").select("id, enviado_em, etapa, anexos").eq("codigo", codigo).single();
  const { data: historico } = await supabase
    .from("historico_etapas")
    .select("etapa, alterado_em, alterado_por")
    .eq("demanda_id", extra?.id)
    .order("alterado_em", { ascending: false });
  const caminhos: string[] = extra?.anexos || [];
  const { data: links } = caminhos.length ? await supabase.storage.from(PASTA_ANEXOS).createSignedUrls(caminhos, 60 * 60) : { data: [] };

  const { data: pdfAssinado } = demanda.pdfCanvas
    ? await supabase.storage.from(PASTA_ANEXOS).createSignedUrl(demanda.pdfCanvas, 60 * 60, { download: `${codigo}.pdf` })
    : { data: null };
  const linkPdf = pdfAssinado?.signedUrl || null;

  const { form, itens } = demanda;
  const dadosCanvas = montarCanvas(form, itens);
  const item = (id: string) => itens.find((x) => x.id === id)?.texto || "";
  const situacao: string = extra?.etapa || "";
  const ganhos = [form.ganho && `${form.ganho} (principal): ${form.justPrinc}`, ...form.ganhosSec.map((g) => `${g}: ${form.justSec[g] || "-"}`)].filter(Boolean).join("\n");

  return (
    <MolduraTime email={email}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Link href="/inovai" style={{ alignSelf: "flex-start", fontSize: 14, fontWeight: 700, color: COR.vermelhoEscuro }}>
          ← Voltar para a lista
        </Link>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COR.vermelhoEscuro }}>{codigo}</p>
            <h1 style={{ margin: "2px 0 0", fontSize: 30, lineHeight: "36px" }}>{item("nome")}</h1>
            <p style={{ margin: "4px 0 0", fontSize: 15, color: COR.suave }}>{item("resumo")}</p>
          </div>
          <BotaoPdf codigo={codigo} linkGuardado={linkPdf} dados={dadosCanvas} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18, alignItems: "start" }}>
          <Bloco titulo="Situação">
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COR.vermelhoEscuro }}>{descreverSituacao(situacao)}</p>
            <MudarSituacao codigo={codigo} atual={situacao} />
            <h3 style={{ margin: "8px 0 0", fontSize: 15 }}>Histórico</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: "21px" }}>
              {(historico || []).map((h, i) => (
                <li key={i}>
                  {descreverSituacao(h.etapa)}: {new Date(h.alterado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}, por {h.alterado_por === "envio" ? "envio da demanda" : h.alterado_por}
                </li>
              ))}
            </ul>
          </Bloco>

          <Bloco titulo="Quem enviou">
            <Campo rotulo="Nome" valor={form.nome} />
            <Campo rotulo="Área" valor={form.area} />
            <Campo rotulo="E-mail" valor={<a href={`mailto:${form.email}`} style={{ color: COR.vermelhoEscuro }}>{form.email}</a>} />
            <Campo rotulo="Enviado em" valor={extra?.enviado_em ? new Date(extra.enviado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "-"} />
          </Bloco>
        </div>

        <Bloco titulo="O que a pessoa contou">
          <Campo rotulo="Problema" valor={form.problema} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <Campo rotulo="Casos por mês" valor={form.volNaoSei ? "Não sabe agora" : form.volume} />
            <Campo rotulo="Custo por caso (R$)" valor={form.valorNaoSei ? "Não sabe agora" : form.valorCaso} />
            <Campo rotulo="Produto ou jornada" valor={form.produto} />
            <Campo rotulo="Time que recebe a solução" valor={form.interessados} />
          </div>
          <Campo rotulo="Ganhos esperados" valor={ganhos} />
          <Campo rotulo="Stakeholders" valor={form.stakeholders} />
          <Campo rotulo="Dados ou observações" valor={form.dados} />
          <Campo
            rotulo="Links"
            valor={
              form.links.length ? (
                <span style={{ display: "flex", flexDirection: "column" }}>
                  {form.links.map((l) => (
                    <a key={l} href={/^https?:\/\//.test(l) ? l : `https://${l}`} target="_blank" rel="noreferrer noopener" style={{ color: COR.vermelhoEscuro }}>
                      {l}
                    </a>
                  ))}
                </span>
              ) : null
            }
          />
          <Campo
            rotulo="Anexos"
            valor={
              caminhos.length ? (
                <span style={{ display: "flex", flexDirection: "column" }}>
                  {caminhos.map((c, i) => (
                    <a key={c} href={links?.[i]?.signedUrl || "#"} target="_blank" rel="noreferrer noopener" style={{ color: COR.vermelhoEscuro }}>
                      {c.split("/").pop()?.replace(/^\d+-/, "")}
                    </a>
                  ))}
                </span>
              ) : null
            }
          />
        </Bloco>

        <Bloco titulo="Itens conferidos no Passo 3">
          <Campo rotulo="Hipótese" valor={item("hipotese")} />
          <Campo rotulo="Riscos iniciais" valor={item("riscos")} />
        </Bloco>

        <Bloco titulo="Canvas">
          <CanvasTela d={dadosCanvas} />
        </Bloco>
      </div>
    </MolduraTime>
  );
}

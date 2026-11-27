"use client";

import PrismaVidro from "./PrismaVidro";
import { COR } from "./ui";
import { ETAPAS_ESTEIRA, PASSOS_PEDIDO } from "@/lib/tipos";

export interface ResultadoConsulta {
  codigo: string;
  /** Etapa da esteira (0 a 7). */
  esteira: number;
  /** Passo do pedido (0 a 4); 5 quando os passos já terminaram (etapa 3 em diante). */
  passo: number;
  nota: string;
}

export interface EstadoConsulta {
  cod: string;
  erro: boolean;
  res: ResultadoConsulta | null;
  /** Mensagem própria do erro; sem ela, mostra "Código não encontrado". */
  mensagem?: string;
}

const TOTAL_PASSOS = PASSOS_PEDIDO.length;
/** Etapas da esteira que vêm depois dos 5 passos (Prototipação em diante). */
const ETAPAS_DEPOIS = ETAPAS_ESTEIRA.slice(2);
/** Pontos da jornada única: 5 passos do pedido e depois as etapas 3 a 8. */
const TOTAL_PONTOS = TOTAL_PASSOS + ETAPAS_DEPOIS.length;

/** Posição da demanda na jornada única (0 a 10). */
function pontoDaJornada(r: ResultadoConsulta) {
  return r.passo < TOTAL_PASSOS ? r.passo : TOTAL_PASSOS + (r.esteira - 2);
}

/** Resultado da consulta: onde a demanda está, em texto e numa barra da jornada inteira. */
function ResultadoVisual({ r }: { r: ResultadoConsulta }) {
  const ponto = pontoDaJornada(r);
  const nosPassos = r.passo < TOTAL_PASSOS;
  return (
    <div role="status" style={{ background: "#ffffff", color: COR.tinta, borderRadius: 12, border: `1px solid ${COR.linhas}`, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ fontSize: 18, fontWeight: 900, color: COR.vermelhoEscuro }}>{r.codigo}</span>
      <p style={{ margin: 0, fontSize: 15, lineHeight: "21px" }}>
        {nosPassos ? (
          <>
            Passo atual: <strong>{PASSOS_PEDIDO[r.passo].t}</strong>
          </>
        ) : (
          <>
            Os passos do pedido foram concluídos. Agora em: <strong>{ETAPAS_ESTEIRA[r.esteira]}</strong>
          </>
        )}
      </p>
      <div aria-hidden="true" style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {Array.from({ length: TOTAL_PONTOS }, (_, i) => (
          <span
            key={i}
            style={{
              flex: i < TOTAL_PASSOS ? 2 : 1,
              height: i < TOTAL_PASSOS ? 10 : 6,
              marginLeft: i === TOTAL_PASSOS ? 6 : 0,
              borderRadius: 9999,
              background: i < ponto ? COR.vermelho : i === ponto ? COR.erro : COR.linhas,
            }}
          />
        ))}
      </div>
      <div aria-hidden="true" style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, fontWeight: 700, color: COR.suave }}>
        <span>Passos do pedido</span>
        <span>Depois do pedido</span>
      </div>
      {r.nota && <p style={{ margin: 0, fontSize: 13, lineHeight: "19px", color: COR.suave }}>{r.nota}</p>}
    </div>
  );
}

/** Caixa "Já enviou um problema?". No celular fica na faixa vermelha; no computador, na área branca. */
function Consulta({
  variante,
  estado,
  onCod,
  onConsultar,
}: {
  variante: "hero" | "web";
  estado: EstadoConsulta;
  onCod: (v: string) => void;
  onConsultar: () => void;
}) {
  const hero = variante === "hero";
  const id = hero ? "f-consulta" : "f-consulta-web";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onConsultar();
      }}
      className={hero ? "so-mob" : "so-desk"}
      style={
        hero
          ? { flex: "1 1 100%", flexDirection: "column", gap: 8 }
          : { display: "flex", flexDirection: "column", gap: 10, padding: "16px 18px", borderRadius: 12, background: COR.fundo }
      }
    >
      <label htmlFor={id} style={{ fontSize: 15, lineHeight: "21px", fontWeight: 700 }}>
        Já enviou um problema? Digite o código e veja em que passo ele está
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxWidth: hero ? undefined : 460 }}>
        <input
          id={id}
          type="text"
          value={estado.cod}
          onChange={(e) => onCod(e.target.value)}
          placeholder="PR-1126-0001"
          autoComplete="off"
          aria-invalid={estado.erro || undefined}
          style={{
            flex: "1 1 180px",
            minWidth: 0,
            minHeight: 48,
            padding: "10px 14px",
            border: `2px solid ${hero ? "#ffffff" : COR.cinzaBorda}`,
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: COR.tinta,
            background: "#ffffff",
          }}
        />
        <button
          type="submit"
          style={{
            minHeight: 48,
            padding: "10px 22px",
            border: hero ? "2px solid #ffffff" : "none",
            borderRadius: 10,
            background: hero ? "transparent" : COR.vermelho,
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          Consultar
        </button>
      </div>
      {estado.erro && (
        <p role="alert" style={{ margin: 0, fontSize: 14, lineHeight: "20px", fontWeight: 700, color: hero ? "#ffffff" : COR.erro }}>
          {estado.mensagem || "Código não encontrado. Confira o formato, por exemplo PR-1126-0001."}
        </p>
      )}
      {estado.res && <ResultadoVisual r={estado.res} />}
    </form>
  );
}

/** Faixa vermelha da página inicial. */
export function HeroInicio({
  consulta,
  onCod,
  onConsultar,
  onComecar,
}: {
  consulta: EstadoConsulta;
  onCod: (v: string) => void;
  onConsultar: () => void;
  onComecar: () => void;
}) {
  return (
    <div
      className="pz-hero-in"
      style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}
    >
      <div style={{ flex: "1 1 340px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", color: COR.amarelo }}>TIME INOVAI · EXPERIMENTAÇÃO</span>
        <h1 className="pz-h1" style={{ margin: 0, lineHeight: 1.1, fontWeight: 900, letterSpacing: "-0.01em" }}>
          Qual problema você quer resolver?
        </h1>
        <p style={{ margin: 0, fontSize: 18, lineHeight: "28px", maxWidth: 560 }}>
          Conte o que está travando seu time ou incomodando o cliente. O time InovAI usa essas informações para entender o problema e levá-lo para a esteira de experimentação.
        </p>
        <div>
          <button
            type="button"
            onClick={onComecar}
            style={{ minHeight: 52, padding: "14px 32px", border: "none", borderRadius: 9999, background: "#ffffff", color: COR.vermelhoEscuro, fontSize: 17, fontWeight: 700 }}
          >
            Contar meu problema
          </button>
        </div>
      </div>
      <div style={{ flex: "1 1 260px", minWidth: 0, maxWidth: 440 }}>
        <PrismaVidro variante="hero" style={{ width: "100%" }} />
      </div>
      <Consulta variante="hero" estado={consulta} onCod={onCod} onConsultar={onConsultar} />
    </div>
  );
}

/** Situação de um ponto da jornada, conforme a consulta: sem consulta, todos aparecem normais. */
function situacao(i: number, ponto: number | null) {
  if (ponto === null) return { atual: false, feito: false, apagado: false };
  return { atual: i === ponto, feito: i < ponto, apagado: i > ponto };
}

/** Seta entre os cartões: para a direita no computador, para baixo no celular. */
function Seta({ apagada }: { apagada?: boolean }) {
  return (
    <svg className="pz-seta" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={apagada ? COR.cinzaBorda : COR.vermelho} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/** Selo pequeno de situação dentro do cartão. */
function Selo({ texto, cheio }: { texto: string; cheio: boolean }) {
  return (
    <span
      style={{
        alignSelf: "flex-start",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        padding: "3px 8px",
        borderRadius: 9999,
        color: cheio ? "#ffffff" : COR.vermelhoEscuro,
        background: cheio ? COR.vermelho : COR.rosa,
      }}
    >
      {texto}
    </span>
  );
}

/** Cartão de um passo do pedido, sem número: a ordem é mostrada pelas setas. */
function CartaoPasso({ i, ponto }: { i: number; ponto: number | null }) {
  const p = PASSOS_PEDIDO[i];
  const { atual, feito, apagado } = situacao(i, ponto);
  return (
    <li
      className="pz-item"
      aria-current={atual ? "step" : undefined}
      style={{
        borderStyle: "solid",
        borderWidth: atual ? "4px 2px 2px" : "4px 1px 1px",
        borderTopColor: apagado ? COR.linhas : COR.vermelho,
        borderRightColor: atual ? COR.vermelho : COR.linhas,
        borderBottomColor: atual ? COR.vermelho : COR.linhas,
        borderLeftColor: atual ? COR.vermelho : COR.linhas,
        borderRadius: 16,
        padding: "14px 12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: atual ? COR.rosa : "#ffffff",
        hyphens: "auto",
        overflowWrap: "break-word",
      }}
    >
      <span style={{ fontSize: 16, lineHeight: "21px", fontWeight: 700, color: apagado ? COR.suave : COR.tinta }}>{p.t}</span>
      <span style={{ fontSize: 14, lineHeight: "20px", color: COR.suave }}>{p.d}</span>
      {feito && <Selo texto="✓ CONCLUÍDO" cheio={false} />}
      {atual && <Selo texto="PASSO ATUAL" cheio />}
    </li>
  );
}

/** Grupo de passos de uma etapa da esteira (Mapeamento: 2 passos; Desenho de solução: 3 passos), ligados por setas. */
function GrupoPassos({ etapa, ponto }: { etapa: 0 | 1; ponto: number | null }) {
  const indices = PASSOS_PEDIDO.map((p, i) => (p.etapa === etapa ? i : -1)).filter((i) => i >= 0);
  const aqui = ponto !== null && indices.includes(ponto);
  return (
    <section
      className={"pz-item " + (etapa === 0 ? "pz-item-2" : "pz-item-3")}
      aria-label={`Etapa ${etapa + 1} da esteira: ${ETAPAS_ESTEIRA[etapa]}`}
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", paddingBottom: 8, borderBottom: `3px solid ${aqui ? COR.vermelho : COR.linhas}` }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: COR.vermelhoEscuro }}>ETAPA {etapa + 1}</span>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{ETAPAS_ESTEIRA[etapa]}</span>
      </div>
      <ol className="pz-trilha" style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
        {indices.map((i, k) => (
          <FragmentoPasso key={i} i={i} ponto={ponto} comSeta={k > 0} />
        ))}
      </ol>
    </section>
  );
}

/** Um cartão, precedido de seta quando não é o primeiro do grupo. */
function FragmentoPasso({ i, ponto, comSeta }: { i: number; ponto: number | null; comSeta: boolean }) {
  return (
    <>
      {comSeta && (
        <li aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Seta apagada={ponto !== null && i > ponto} />
        </li>
      )}
      <CartaoPasso i={i} ponto={ponto} />
    </>
  );
}

/** Continuação da mesma jornada, depois dos passos do pedido: as próximas etapas da esteira, menores e sem número. */
function DepoisDoPedido({ ponto }: { ponto: number | null }) {
  return (
    <section aria-label="Depois do pedido: próximas etapas da esteira" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", paddingBottom: 8, borderBottom: `3px solid ${ponto !== null && ponto >= TOTAL_PASSOS ? COR.vermelho : COR.linhas}` }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: COR.vermelhoEscuro }}>DEPOIS DO PEDIDO</span>
        <span style={{ fontSize: 15, fontWeight: 700 }}>A solução segue pelas próximas etapas da esteira</span>
      </div>
      <ol style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
        {ETAPAS_DEPOIS.map((nome, j) => {
          const i = TOTAL_PASSOS + j;
          const { atual, feito, apagado } = situacao(i, ponto);
          return (
            <li key={nome} aria-current={atual ? "step" : undefined} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {j > 0 && (
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={apagado ? COR.cinzaBorda : COR.vermelho} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h13" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              )}
              <span
                style={{
                  padding: "7px 12px",
                  borderRadius: 9999,
                  fontSize: 13,
                  lineHeight: "17px",
                  fontWeight: 700,
                  border: `${atual ? 2 : 1}px solid ${atual ? COR.vermelho : COR.linhas}`,
                  background: atual ? COR.vermelho : feito ? COR.rosa : COR.fundo,
                  color: atual ? "#ffffff" : apagado ? COR.suave : COR.tinta,
                }}
              >
                {feito && "✓ "}
                {nome}
                {atual && <span className="sr-only"> (etapa atual)</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <p style={{ margin: 0, fontSize: 13, lineHeight: "19px", color: COR.suave }}>O Piloto só acontece depois dos testes, com os resultados em mãos.</p>
    </section>
  );
}

/** Conteúdo da área branca na página inicial: uma jornada só, do pedido ao crescimento. */
export function ConteudoInicio({
  consulta,
  onCod,
  onConsultar,
}: {
  consulta: EstadoConsulta;
  onCod: (v: string) => void;
  onConsultar: () => void;
}) {
  const ponto = consulta.res ? pontoDaJornada(consulta.res) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 className="pz-h2" style={{ margin: 0, lineHeight: 1.2, fontWeight: 700 }}>
        Como funciona o seu pedido
      </h2>
      <p style={{ margin: 0, fontSize: 16, lineHeight: "24px", color: COR.suave }}>
        O seu pedido acontece nas duas primeiras etapas da esteira de experimentação do time InovAI. Depois, a solução segue pelas próximas etapas.
      </p>
      <Consulta variante="web" estado={consulta} onCod={onCod} onConsultar={onConsultar} />
      <div className="pz-trilha" style={{ gap: 10 }}>
        <GrupoPassos etapa={0} ponto={ponto} />
        <div aria-hidden="true" className="pz-seta-grupo" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Seta apagada={ponto !== null && ponto < 2} />
        </div>
        <GrupoPassos etapa={1} ponto={ponto} />
      </div>
      <DepoisDoPedido ponto={ponto} />
    </div>
  );
}

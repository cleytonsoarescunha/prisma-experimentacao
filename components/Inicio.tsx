"use client";

import PrismaVidro from "./PrismaVidro";
import { COR } from "./ui";
import { ETAPAS_ESTEIRA } from "@/lib/tipos";

export interface ResultadoConsulta {
  codigo: string;
  idx: number;
  nota: string;
}

export interface EstadoConsulta {
  cod: string;
  erro: boolean;
  res: ResultadoConsulta | null;
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
  const r = estado.res;
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
          : { display: "flex", flexDirection: "column", gap: 8, padding: "16px 18px", borderRadius: 12, background: COR.fundo }
      }
    >
      <label htmlFor={id} style={{ fontSize: 15, lineHeight: "21px", fontWeight: 700 }}>
        Já enviou um problema? Digite o código e veja onde ele está na esteira
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
          Código não encontrado. Confira o formato, por exemplo PR-1126-0001.
        </p>
      )}
      {r &&
        (hero ? (
          <div role="status" style={{ background: "#ffffff", color: COR.tinta, borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: COR.vermelhoEscuro }}>{r.codigo}</span>
              <span style={{ fontSize: 13, color: COR.suave }}>Etapa {r.idx + 1} de 8</span>
            </div>
            <div aria-hidden="true" style={{ display: "flex", gap: 4 }}>
              {ETAPAS_ESTEIRA.map((_, i) => (
                <span key={i} style={{ flex: 1, height: 8, borderRadius: 9999, background: i < r.idx ? COR.vermelho : i === r.idx ? COR.erro : COR.linhas }} />
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: "21px" }}>
              Etapa atual: <strong>{ETAPAS_ESTEIRA[r.idx]}</strong>
            </p>
            <p style={{ margin: 0, fontSize: 13, lineHeight: "19px", color: COR.suave }}>{r.nota}</p>
          </div>
        ) : (
          <p role="status" style={{ margin: 0, fontSize: 15, lineHeight: "22px" }}>
            <strong style={{ color: COR.vermelhoEscuro }}>{r.codigo}</strong> está na etapa {r.idx + 1} de 8:{" "}
            <strong>{ETAPAS_ESTEIRA[r.idx]}</strong>. {r.nota}
          </p>
        ))}
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

function Esteira({ atualIdx }: { atualIdx: number }) {
  const itens = ETAPAS_ESTEIRA.map((label, i) => {
    const feito = i < atualIdx;
    const atual = i === atualIdx;
    return {
      label,
      n: i + 1,
      atual,
      cBorder: feito ? "none" : atual ? `3px solid ${COR.vermelho}` : `2px solid ${COR.linhas}`,
      cBg: feito ? COR.vermelho : "#ffffff",
      cColor: feito ? "#ffffff" : atual ? COR.vermelhoEscuro : COR.cinza,
      nmColor: feito ? COR.tinta : atual ? COR.vermelhoEscuro : COR.suave,
      lnL: i === 0 ? "transparent" : i <= atualIdx ? COR.vermelho : COR.linhas,
      lnR: i === ETAPAS_ESTEIRA.length - 1 ? "transparent" : i < atualIdx ? COR.vermelho : COR.linhas,
    };
  });
  const circulo = (e: (typeof itens)[number]) => (
    <span
      style={{
        width: 36,
        height: 36,
        flex: "0 0 auto",
        borderRadius: 9999,
        border: e.cBorder,
        background: e.cBg,
        color: e.cColor,
        fontSize: 15,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {e.n}
    </span>
  );
  const selo = (texto: string) => (
    <span style={{ alignSelf: "flex-start", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#ffffff", background: COR.vermelho, padding: "3px 8px", borderRadius: 9999 }}>
      {texto}
    </span>
  );

  return (
    <>
      <ol aria-label="Esteira de experimentação" className="so-desk" style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
        {itens.map((e) => (
          <li key={e.n} aria-current={e.atual ? "step" : undefined} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {circulo(e)}
              <span style={{ flexGrow: 1, height: 3, background: e.lnR }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, lineHeight: "17px", color: e.nmColor }}>{e.label}</span>
            {e.atual && selo("ETAPA ATUAL")}
          </li>
        ))}
      </ol>
      <div className="so-mob" style={{ flexDirection: "column", gap: 6 }}>
        <span aria-hidden="true" style={{ alignSelf: "flex-end", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: COR.vermelhoEscuro }}>
          ARRASTE →
        </span>
        <div tabIndex={0} aria-label="Esteira de experimentação" style={{ border: `1px solid ${COR.linhas}`, borderRadius: 14, background: "#ffffff", padding: "14px 0", overflowX: "auto" }}>
          <ol style={{ display: "flex", width: "max-content", padding: "0 16px", margin: 0, listStyle: "none" }}>
            {itens.map((e) => (
              <li key={e.n} aria-current={e.atual ? "step" : undefined} style={{ flex: "0 0 112px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ flexGrow: 1, height: 3, background: e.lnL }} />
                  {circulo(e)}
                  <span style={{ flexGrow: 1, height: 3, background: e.lnR }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, lineHeight: "17px", textAlign: "center", padding: "0 6px", color: e.nmColor }}>{e.label}</span>
                {e.atual && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#ffffff", background: COR.vermelho, padding: "3px 8px", borderRadius: 9999 }}>ATUAL</span>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}

const PASSOS_INICIO = [
  { t: "Você conta o problema", d: "O que acontece, quem sente e o tamanho do problema.", icone: "seta" },
  { t: "Organizamos as informações", d: "Objetivo, hipótese, riscos e uma primeira ideia de teste, para você conferir.", icone: "seta" },
  { t: "Conversamos e experimentamos", d: "Você recebe o canvas pré-preenchido por e-mail, marcamos uma reunião e o time InovAI segue na esteira.", icone: "bandeira" },
];

/** Conteúdo da área branca na página inicial. */
export function ConteudoInicio({
  consulta,
  onCod,
  onConsultar,
}: {
  consulta: EstadoConsulta;
  onCod: (v: string) => void;
  onConsultar: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 className="pz-h2" style={{ margin: 0, lineHeight: 1.2, fontWeight: 700 }}>
        Seu problema entra na nossa esteira de experimentação
      </h2>
      <p style={{ margin: 0, fontSize: 16, lineHeight: "24px", color: COR.suave }}>
        Você conta o problema e o time InovAI conduz o resto: entende, desenha a solução e testa antes de chegar ao cliente.
      </p>
      <Consulta variante="web" estado={consulta} onCod={onCod} onConsultar={onConsultar} />
      <Esteira atualIdx={consulta.res ? consulta.res.idx : 0} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {PASSOS_INICIO.map((p, i) => (
          <div
            key={p.t}
            style={{ border: `1px solid ${COR.linhas}`, borderTop: `4px solid ${COR.vermelho}`, borderRadius: 16, padding: "20px 22px 22px", display: "flex", flexDirection: "column", gap: 10, background: "#ffffff" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 44, height: 44, borderRadius: 9999, background: COR.vermelho, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flex: "none" }}>
                {i + 1}
              </span>
              <span style={{ flex: 1, height: 2, background: "linear-gradient(90deg, #e2262b, rgba(226,38,43,0.15))" }} />
              {p.icone === "seta" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COR.vermelho} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
                  <path d="M9 6l6 6-6 6" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COR.vermelho} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
                  <path d="M5 21V4" />
                  <path d="M5 4h11l-2 4 2 4H5" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 18, lineHeight: "24px", fontWeight: 700 }}>{p.t}</span>
            <span style={{ fontSize: 15, lineHeight: "22px", color: COR.suave }}>{p.d}</span>
          </div>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: COR.suave }}>O Piloto só acontece depois dos testes, com os resultados em mãos.</p>
    </div>
  );
}

"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import { COR, IconeFrasco } from "./ui";
import type { DadosCanvas } from "@/lib/regras";

const F = [22, 21, 20, 19, 18];
const LH = [29, 28, 27, 25, 24];

const rotuloAmarelo = { margin: 0, fontSize: 20, lineHeight: "26px", fontWeight: 700, color: COR.amarelo } as const;

function Secao({ titulo, icone, children }: { titulo: string; icone: ReactNode; children: ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "row", gap: 14, alignItems: "center" }}>
        <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: 34, height: 34 }} fill="none" stroke={COR.vermelho} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icone}
        </svg>
        <h3 style={{ margin: 0, fontSize: 28, lineHeight: "36px", fontWeight: 700, color: COR.tinta }}>{titulo}</h3>
      </div>
      {children}
    </div>
  );
}

/** O slide do canvas em tamanho real (1920 x 1080). */
export function CanvasSlide({
  d,
  nivel,
  nivelT,
  ladoRef,
  corpoRef,
}: {
  d: DadosCanvas;
  nivel: number;
  nivelT: number;
  ladoRef?: Ref<HTMLDivElement>;
  corpoRef?: Ref<HTMLDivElement>;
}) {
  const texto = { margin: 0, fontSize: F[nivel], lineHeight: LH[nivel] + "px", color: COR.tinta } as const;
  const tituloBase = d.titulo.length > 34 ? 46 : 54;
  const tituloTam = Math.max(34, tituloBase - 6 * nivelT);
  const divisor = <div style={{ height: 1, background: "#e6e3e0" }} />;

  return (
    <div
      role="img"
      aria-label={`Canvas de iniciativa pré-preenchido: ${d.titulo}`}
      style={{ position: "relative", width: 1920, height: 1080, background: "#ffffff", color: COR.tinta, fontFamily: "var(--font-roboto), Roboto, Arial, sans-serif", display: "flex", flexDirection: "row", textAlign: "left" }}
    >
      {/* Barra lateral vermelha */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 490, height: 1080, background: COR.vermelho }} />
      <div ref={ladoRef} style={{ position: "relative", width: 490, height: 1080, flex: "none", padding: "52px 48px 44px 48px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <h1 style={{ margin: 0, fontSize: tituloTam, lineHeight: 1.06, fontWeight: 700, color: "#ffffff", padding: "0 0 14px 0" }}>{d.titulo}</h1>
        <p style={{ margin: 0, fontSize: 24, lineHeight: "32px", color: "#ffffff" }}>{d.subtitulo}</p>
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 10, padding: "22px 0 0 0" }}>
          {d.classes.map((c) => (
            <p
              key={c.t}
              style={{ margin: 0, fontSize: 20, lineHeight: "24px", fontWeight: 700, color: c.principal ? COR.vermelho : "#ffffff", background: c.principal ? "#ffffff" : "transparent", border: "2px solid #ffffff", borderRadius: 999, padding: "6px 14px" }}
            >
              {c.t}
            </p>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "30px 0 0 0" }}>
          <p style={{ ...rotuloAmarelo, letterSpacing: 3 }}>PRODUTO BENEFICIADO</p>
          <p style={{ margin: 0, fontSize: 40, lineHeight: "44px", fontWeight: 700, color: "#ffffff" }}>{d.produto}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "36px 0 0 0" }}>
          <p style={{ ...rotuloAmarelo, letterSpacing: 3 }}>CENÁRIO REALISTA</p>
          {d.temHero ? (
            <>
              <div style={{ display: "flex", flexDirection: "row", gap: 10, alignItems: "baseline" }}>
                <p style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap" }}>R$</p>
                <p style={{ margin: 0, fontSize: 96, lineHeight: 1, fontWeight: 700, color: "#ffffff", letterSpacing: -2, whiteSpace: "nowrap" }}>{d.heroNum}</p>
                <p style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap" }}>{d.heroUni}</p>
              </div>
              <p style={{ margin: 0, fontSize: 30, lineHeight: "38px", fontWeight: 700, color: "#ffffff" }}>{d.heroLinha}</p>
              <p style={{ margin: 0, fontSize: 22, lineHeight: "30px", color: "#ffffff" }}>{d.heroNota}</p>
            </>
          ) : (
            <p style={{ margin: "6px 0 0 0", fontSize: 34, lineHeight: "42px", fontWeight: 700, color: "#ffffff" }}>[a ser preenchido]</p>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ height: 2, background: "#ee7c80" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "20px 0 0 0" }}>
          <p style={rotuloAmarelo}>Custo estimado</p>
          <p style={{ margin: 0, fontSize: 28, lineHeight: "34px", fontWeight: 700, color: "#ffffff" }}>[a ser preenchido]</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "10px 14px", padding: "16px 0 0 0" }}>
          <p style={{ ...rotuloAmarelo, lineHeight: "28px" }}>Equipes</p>
          <p style={{ margin: 0, fontSize: 22, lineHeight: "28px", color: "#ffffff" }}>{d.equipes}</p>
          <p style={{ ...rotuloAmarelo, lineHeight: "28px" }}>Stakeholders</p>
          <p style={{ margin: 0, fontSize: 22, lineHeight: "28px", color: "#ffffff", whiteSpace: "pre-line" }}>{d.stakeholders}</p>
        </div>
      </div>

      {/* Área branca */}
      <div ref={corpoRef} style={{ flex: 1, minWidth: 0, height: 1080, padding: "56px 56px 96px 56px", display: "flex", flexDirection: "column", gap: nivel >= 2 ? 16 : 22, overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "row", gap: 48, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
            <Secao titulo="Problema" icone={<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>}>
              <p style={texto}>{d.problema}</p>
            </Secao>
            {divisor}
            <Secao titulo="Proposta" icone={<><path d="M9 18h6M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" /></>}>
              <p style={texto}>{d.proposta}</p>
            </Secao>
            {divisor}
            <div style={{ display: "flex", flexDirection: "row", gap: 32, alignItems: "flex-start" }}>
              <Secao titulo="Benefícios" icone={<><path d="M7 10v11H3V10z" /><path d="M7 10l4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7" /></>}>
                {d.beneficios.length ? (
                  <ul style={{ ...texto, padding: "0 0 0 28px" }}>
                    {d.beneficios.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={texto}>[a ser preenchido]</p>
                )}
              </Secao>
              <Secao titulo="Hipótese" icone={<path d="M3 12h4l3-8 4 16 3-8h4" />}>
                <p style={texto}>{d.hipotese}</p>
              </Secao>
            </div>
          </div>
          <div style={{ width: 500, flex: "none", background: COR.rosa, borderRadius: 16, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ margin: 0, fontSize: 20, lineHeight: "26px", fontWeight: 700, letterSpacing: 3, color: COR.vermelhoEscuro, padding: "0 0 8px 0" }}>DA BASE AO IMPACTO</p>
            <div style={{ display: "grid", gridTemplateColumns: "136px 1fr", gap: "4px 10px" }}>
              {d.linhas.map((ln, i) => (
                <div key={i} style={{ display: "contents" }}>
                  <p style={{ margin: 0, fontSize: 22, lineHeight: "30px", fontWeight: 700 }}>{ln.a}</p>
                  <p style={{ margin: 0, fontSize: 22, lineHeight: "30px" }}>{ln.b}</p>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: "#e8b4b6", width: 436 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0 0 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", borderLeft: `6px solid ${COR.cinza}`, borderRadius: 8, padding: "10px 18px" }}>
                <p style={{ margin: 0, fontSize: 20, lineHeight: "26px", fontWeight: 700, letterSpacing: 2, color: COR.suave }}>PESSIMISTA | 30%</p>
                <p style={{ margin: 0, fontSize: 26, lineHeight: "32px", fontWeight: 700 }}>{d.cPess}</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COR.vermelho, borderRadius: 8, padding: "12px 18px" }}>
                <p style={{ margin: 0, fontSize: 20, lineHeight: "26px", fontWeight: 700, letterSpacing: 2, color: "#ffffff" }}>REALISTA | 50%</p>
                <p style={{ margin: 0, fontSize: 28, lineHeight: "34px", fontWeight: 700, color: "#ffffff" }}>{d.cReal}</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", borderLeft: `6px solid ${COR.laranja}`, borderRadius: 8, padding: "10px 18px" }}>
                <p style={{ margin: 0, fontSize: 20, lineHeight: "26px", fontWeight: 700, letterSpacing: 2, color: COR.suave }}>OTIMISTA | 70%</p>
                <p style={{ margin: 0, fontSize: 26, lineHeight: "32px", fontWeight: 700 }}>{d.cOtim}</p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 20, lineHeight: "26px", color: COR.suave, padding: "8px 0 0 0" }}>{d.premissa}</p>
          </div>
        </div>
        <div style={{ height: 2, background: COR.vermelho, width: 96, flex: "none" }} />
        <div style={{ display: "flex", flexDirection: "row", gap: 48 }}>
          <Secao titulo="Critérios de sucesso da PoC" icone={<><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>}>
            <p style={texto}>[a ser preenchido]</p>
          </Secao>
          <Secao titulo="Riscos" icone={<><path d="M12 3 2 21h20z" /><path d="M12 10v5M12 18h.01" /></>}>
            <ul style={{ ...texto, padding: "0 0 0 28px" }}>
              {d.riscos.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </Secao>
        </div>
      </div>

      {/* Selo no pé */}
      <div style={{ position: "absolute", left: 546, top: 1004, width: 52, height: 52, background: COR.vermelho, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <IconeFrasco tamanho={30} />
      </div>
      <div style={{ position: "absolute", left: 614, top: 1004, width: 520, height: 52, display: "flex", flexDirection: "column", justifyContent: "center", gap: 5 }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 22, lineHeight: "26px", fontWeight: 700, letterSpacing: "0.08em", color: COR.vermelho, whiteSpace: "nowrap" }}>EXPERIMENTAÇÃO</p>
          <div style={{ width: 1, height: 24, background: COR.cinzaBorda }} />
          <p style={{ margin: 0, fontSize: 22, lineHeight: "26px", color: COR.suave, whiteSpace: "nowrap" }}>CoE Digital</p>
        </div>
        <div style={{ width: 96, height: 3, background: "linear-gradient(90deg, #e2262b, rgba(226,38,43,0))" }} />
      </div>
    </div>
  );
}

/**
 * Canvas na tela: reduzido para caber na largura disponível, com opção de ampliar.
 * Se o texto não couber, diminui a fonte aos poucos (nunca corta).
 * Também deixa pronta uma cópia em tamanho real, usada só na impressão / PDF.
 */
export function CanvasTela({ d }: { d: DadosCanvas }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ladoRef = useRef<HTMLDivElement>(null);
  const corpoRef = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(760);
  const [zoom, setZoom] = useState(false);
  const [nivel, setNivel] = useState(0);
  const [nivelT, setNivelT] = useState(0);
  // A tela final só aparece depois de interação no navegador, então document já existe.
  const montado = typeof document !== "undefined";

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setLargura(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reduz a fonte até o conteúdo caber nas áreas do slide.
  useLayoutEffect(() => {
    const c = corpoRef.current;
    const l = ladoRef.current;
    if (c && c.scrollHeight > c.clientHeight + 1 && nivel < 4) {
      setNivel(nivel + 1);
      return;
    }
    if (l && l.scrollHeight > l.clientHeight + 1 && nivelT < 3) setNivelT(nivelT + 1);
  }, [d, nivel, nivelT]);

  const fit = Math.max(0.1, (largura - 2) / 1920);
  const zoomAtivo = zoom && fit < 0.5;
  const esc = zoomAtivo ? 0.5 : fit;

  return (
    <>
      {fit < 0.5 && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => setZoom(!zoom)}
            aria-pressed={zoom}
            style={{ minHeight: 40, padding: "8px 16px", border: `1px solid ${COR.cinzaBorda}`, borderRadius: 9999, background: "#ffffff", color: COR.tinta, fontSize: 14, fontWeight: 700 }}
          >
            {zoom ? "Ajustar à tela" : "Ampliar canvas"}
          </button>
        </div>
      )}
      <div ref={wrapRef} tabIndex={zoomAtivo ? 0 : undefined} style={{ width: "100%", overflowX: zoomAtivo ? "auto" : "hidden", border: `1px solid ${COR.linhas}`, borderRadius: 10, background: "#ffffff" }}>
        <div style={{ position: "relative", width: Math.round(1920 * esc), height: Math.round(1080 * esc), overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${esc})`, transformOrigin: "0 0" }}>
            <CanvasSlide d={d} nivel={nivel} nivelT={nivelT} ladoRef={ladoRef} corpoRef={corpoRef} />
          </div>
        </div>
      </div>
      {montado &&
        createPortal(
          <div className="cv-impressao" aria-hidden="true">
            <CanvasSlide d={d} nivel={nivel} nivelT={nivelT} />
          </div>,
          document.body,
        )}
    </>
  );
}

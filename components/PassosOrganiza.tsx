"use client";

import { useState } from "react";
import PrismaVidro from "./PrismaVidro";
import { COR, Sobretitulo, botaoPrimario } from "./ui";
import type { IdItem, ItemOrganizado } from "@/lib/tipos";

const ETAPAS_ESPERA = ["Lendo o que você contou", "Organizando a hipótese", "Preparando o resumo para o time InovAI"];

/** Passo 2: tela de espera enquanto o relato é organizado. */
export function PassoOrganizando({ etapa }: { etapa: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "24px 0", textAlign: "center" }}>
      <div style={{ width: 260, maxWidth: "80%" }}>
        <PrismaVidro animado style={{ width: "100%" }} />
      </div>
      <Sobretitulo>PASSO 2 · ORGANIZAMOS</Sobretitulo>
      <h2 className="pz-h2" style={{ margin: 0, lineHeight: 1.2, fontWeight: 700 }}>
        Organizando o que você contou
      </h2>
      <ul aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start", listStyle: "none", padding: 0, margin: 0 }}>
        {ETAPAS_ESPERA.map((l, i) => {
          const feito = etapa > i;
          return (
            <li key={l} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                aria-hidden="true"
                style={{ width: 24, height: 24, borderRadius: 9999, background: feito ? COR.vermelho : COR.linhas, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flex: "none" }}
              >
                {feito ? "✓" : ""}
              </span>
              <span style={{ fontSize: 16, lineHeight: "22px", color: feito ? COR.tinta : COR.suave }}>
                {l}
                {feito && <span className="sr-only"> (concluído)</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const DICAS: Partial<Record<IdItem, string>> = {
  resumo: "Uma frase curta sobre o problema. Ela vira o subtítulo do canvas.",
  nome: "Criativo e claro: ao ler, já dá para entender o que a solução faz.",
  hipotese: "Formato: Acredito que [ação], porque [razão], o que resultará em [resultado].",
};

/** Passo 3: a pessoa confere os quatro itens e envia. */
export function PassoConfere({
  problema,
  itens,
  onItens,
  onEditarRelato,
  onEnviar,
}: {
  problema: string;
  itens: ItemOrganizado[];
  onItens: (itens: ItemOrganizado[]) => void;
  onEditarRelato: () => void;
  onEnviar: () => Promise<string | null>;
}) {
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const confirmados = itens.filter((x) => x.aceito).length;
  const todos = confirmados === itens.length;
  const resumo = problema.length > 180 ? problema.slice(0, 177) + "..." : problema;

  function atualiza(i: number, patch: Partial<ItemOrganizado>) {
    onItens(itens.map((y, j) => (j === i ? { ...y, ...patch } : y)));
    setErroEnvio(null);
  }

  async function enviar() {
    if (enviando) return;
    if (!todos) {
      setErroEnvio("Confirme todos os campos antes de enviar.");
      return;
    }
    setEnviando(true);
    setErroEnvio(null);
    const falha = await onEnviar();
    if (falha) {
      setErroEnvio(falha);
      setEnviando(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Sobretitulo>PASSO 3 · VOCÊ CONFERE</Sobretitulo>
        <h2 className="pz-h2" style={{ margin: 0, lineHeight: 1.2, fontWeight: 700 }}>
          Confira o resumo do seu problema
        </h2>
        <p style={{ margin: 0, fontSize: 16, lineHeight: "24px", color: COR.suave }}>
          Organizamos o que você contou em um resumo do problema, um nome para a solução, uma hipótese e os riscos iniciais. Confirme ou ajuste: isso prepara a conversa com o time InovAI, que desenha e conduz o experimento.
        </p>
      </div>

      <div style={{ border: `2px solid ${COR.suave}`, borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: "16px", fontWeight: 700, letterSpacing: "0.12em", color: COR.suave }}>VOCÊ CONTOU</p>
          <button
            type="button"
            onClick={onEditarRelato}
            aria-label="Editar o que você contou"
            style={{ minHeight: 36, padding: "6px 14px", border: "none", background: "transparent", color: COR.vermelhoEscuro, fontSize: 14, fontWeight: 700, textDecoration: "underline" }}
          >
            Editar
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: "22px" }}>{resumo}</p>
      </div>

      {itens.map((it, i) => {
        const fid = "ia-" + it.id;
        return (
          <section
            key={it.id}
            aria-labelledby={fid + "-t"}
            style={{ border: `2px ${it.aceito ? "solid" : "dashed"} ${COR.vermelho}`, background: it.aceito ? "#ffffff" : COR.rosa, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <h3 id={fid + "-t"} style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 700 }}>
                  {it.titulo}
                </h3>
                {DICAS[it.id] && <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", color: COR.suave }}>{DICAS[it.id]}</p>}
              </div>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 9999,
                  border: `2px ${it.aceito ? "solid" : "dashed"} ${COR.vermelho}`,
                  background: it.aceito ? COR.vermelho : "#ffffff",
                  color: it.aceito ? "#ffffff" : COR.vermelhoEscuro,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                {it.aceito ? "CONFIRMADO" : "PARA CONFERIR"}
              </span>
            </div>
            {it.editando ? (
              <>
                <label htmlFor={fid} style={{ fontSize: 13, lineHeight: "18px", color: COR.suave }}>
                  Ajuste o texto sugerido
                </label>
                <textarea
                  id={fid}
                  rows={it.id === "riscos" ? 5 : 3}
                  value={it.texto}
                  onChange={(e) => atualiza(i, { texto: e.target.value })}
                  autoFocus
                  style={{ width: "100%", padding: "12px 14px", border: `2px solid ${COR.suave}`, borderRadius: 10, fontSize: 15, lineHeight: "22px", background: "#ffffff", resize: "vertical", color: COR.tinta }}
                />
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 15, lineHeight: "23px", whiteSpace: "pre-line" }}>{it.texto}</p>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {!it.aceito && (
                <button
                  type="button"
                  onClick={() => atualiza(i, { aceito: true, editando: false })}
                  style={{ ...botaoPrimario, minHeight: 44, padding: "10px 22px", fontSize: 15 }}
                >
                  {it.editando ? "Salvar e confirmar" : "Confirmar"}
                </button>
              )}
              {!it.editando && (
                <button
                  type="button"
                  onClick={() => atualiza(i, { editando: true, aceito: false })}
                  aria-label={"Editar " + it.titulo.toLowerCase()}
                  style={{ minHeight: 44, padding: "10px 20px", border: `2px solid ${COR.vermelho}`, borderRadius: 9999, background: "#ffffff", color: COR.vermelhoEscuro, fontSize: 15, fontWeight: 700 }}
                >
                  Editar
                </button>
              )}
            </div>
          </section>
        );
      })}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: `2px solid ${COR.linhas}` }}>
        <p aria-live="polite" style={{ margin: 0, fontSize: 15, lineHeight: "22px", fontWeight: 700, color: COR.suave }}>
          {confirmados} de {itens.length} campos confirmados
        </p>
        <button
          type="button"
          aria-disabled={!todos || enviando}
          onClick={enviar}
          style={{ ...botaoPrimario, opacity: todos && !enviando ? 1 : 0.45, cursor: enviando ? "wait" : "pointer" }}
        >
          {enviando ? "Enviando..." : "Enviar para o time InovAI"}
        </button>
      </div>
      {erroEnvio && (
        <div role="alert" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, padding: "12px 16px", borderRadius: 10, background: COR.rosa, color: COR.erro, fontSize: 15, lineHeight: "22px", fontWeight: 700 }}>
          <p style={{ margin: 0 }}>{erroEnvio}</p>
          <button
            type="button"
            onClick={onEditarRelato}
            style={{ minHeight: 40, padding: "8px 16px", border: `2px solid ${COR.vermelho}`, borderRadius: 9999, background: "#ffffff", color: COR.vermelhoEscuro, fontSize: 14, fontWeight: 700 }}
          >
            Voltar e corrigir o que você contou
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CanvasTela } from "./Canvas";
import { COR, botaoSecundario } from "./ui";
import { montarCanvas } from "@/lib/regras";
import type { Demanda } from "@/lib/tipos";
import { temCustoPorCaso } from "@/lib/validacao";

/** Tela final: código da demanda, aviso de números faltando, canvas e próximo passo. */
export default function TelaFim({ demanda, onRecomecar }: { demanda: Demanda; onRecomecar: () => void }) {
  const { form, codigo } = demanda;
  const dados = useMemo(() => montarCanvas(form, demanda.itens), [form, demanda.itens]);
  const [baixou, setBaixou] = useState(false);
  const [copiado, setCopiado] = useState<"" | "ok" | "erro">("");

  /** Plano B para navegadores que bloqueiam a área de transferência moderna. */
  function copiarAntigo(texto: string): boolean {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    campo.remove();
    return ok;
  }

  async function copiar() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(codigo);
      ok = true;
    } catch {
      ok = copiarAntigo(codigo);
    }
    setCopiado(ok ? "ok" : "erro");
    if (ok) window.setTimeout(() => setCopiado(""), 3000);
  }

  const pendencias = [
    form.volNaoSei ? "Quantas vezes o problema acontece por mês (pedidos, chamados, clientes afetados)" : null,
    !temCustoPorCaso(form) ? "Quanto custa cada caso, ou quanto se perde de receita por caso" : null,
  ].filter((x): x is string => !!x);

  function baixar() {
    // Fatia 1: usa a janela de impressão do navegador ("Salvar como PDF"). O PDF gerado no servidor chega na Fatia 4.
    const antes = document.title;
    document.title = codigo;
    const volta = () => {
      document.title = antes;
      window.removeEventListener("afterprint", volta);
    };
    window.addEventListener("afterprint", volta);
    setBaixou(true);
    window.print();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 9999, background: COR.vermelho, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: 30, height: 30 }} fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5 9-10" />
          </svg>
        </div>
        <h2 className="pz-h2" style={{ margin: 0, lineHeight: 1.2, fontWeight: 700 }}>
          Recebemos o seu problema
        </h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "8px 16px", border: `2px solid ${COR.vermelho}`, borderRadius: 10, background: "#ffffff" }}>
          <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 700, letterSpacing: "0.12em", color: COR.suave }}>CÓDIGO DA DEMANDA</span>
          <span style={{ fontSize: 20, lineHeight: "26px", fontWeight: 900, color: COR.vermelhoEscuro }}>{codigo}</span>
        </div>
        <button
          type="button"
          onClick={copiar}
          aria-label={"Copiar o código " + codigo}
          style={{ ...botaoSecundario, minHeight: 44, padding: "8px 18px", display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {copiado === "ok" ? (
              <path d="m5 12 5 5 9-10" />
            ) : (
              <>
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
              </>
            )}
          </svg>
          {copiado === "ok" ? "Código copiado" : "Copiar código"}
        </button>
        <span role="status" style={{ fontSize: 13, lineHeight: "18px", color: COR.erro, fontWeight: 700 }}>
          {copiado === "erro" ? "Não deu para copiar. Selecione o código e use Ctrl+C." : ""}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 16, lineHeight: "24px", color: COR.suave, overflowWrap: "anywhere" }}>
        Enviamos o seu canvas pré-preenchido para {form.email}. Use o código {codigo} para falar sobre esta demanda. O próximo passo é uma reunião rápida com o time InovAI.
      </p>

      {!!demanda.anexosComFalha?.length && (
        <p role="alert" style={{ margin: 0, padding: "12px 16px", borderRadius: 10, background: COR.rosa, color: COR.erro, fontSize: 15, lineHeight: "22px", fontWeight: 700 }}>
          Não conseguimos guardar estes anexos: {demanda.anexosComFalha.join(", ")}. Leve-os para a reunião com o time InovAI.
        </p>
      )}

      {pendencias.length > 0 && (
        <div role="note" style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 18px", borderRadius: 12, background: "#fff7e0", border: `2px solid ${COR.amarelo}` }}>
          <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={COR.tinta} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
            <path d="M9 4h6l1 2h3v14H5V6h3z" />
            <path d="M9 12h6M9 16h4" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 700 }}>Leve estes números para a reunião</p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 15, lineHeight: "22px" }}>
              {pendencias.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: COR.suave }}>Com eles, o time InovAI calcula o tamanho do problema e o impacto no seu canvas.</p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: "16px", fontWeight: 700, letterSpacing: "0.12em", color: COR.suave }}>SEU CANVAS PRÉ-PREENCHIDO</p>
          <button type="button" onClick={baixar} style={{ ...botaoSecundario, minHeight: 44, padding: "10px 20px" }}>
            Baixar {codigo}.pdf
          </button>
        </div>
        <CanvasTela d={dados} />
        <p style={{ margin: 0, fontSize: 13, lineHeight: "19px", color: COR.suave }}>Os campos [a ser preenchido] são completados com o time InovAI na reunião de aprofundamento.</p>
        {baixou && (
          <p role="status" style={{ margin: 0, fontSize: 13, lineHeight: "19px", color: COR.vermelhoEscuro, fontWeight: 700 }}>
            Na janela que abriu, escolha &quot;Salvar como PDF&quot;.
          </p>
        )}
      </div>

      <div style={{ border: `2px dashed ${COR.vermelho}`, borderRadius: 14, padding: 20, display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 9999, background: COR.vermelho, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: 24, height: 24 }} fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h3 style={{ margin: 0, fontSize: 20, lineHeight: "26px", fontWeight: 700 }}>Próximo passo: reunião de aprofundamento</h3>
          <p style={{ margin: 0, fontSize: 15, lineHeight: "22px", color: COR.suave }}>
            O time InovAI vai entrar em contato para agendar uma conversa com você. Nela, confirmamos os dados e aprofundamos o problema e os benefícios.
          </p>
        </div>
      </div>

      <button type="button" onClick={onRecomecar} style={{ ...botaoSecundario, alignSelf: "flex-start", minHeight: 44, padding: "10px 22px" }}>
        Contar outro problema
      </button>
    </div>
  );
}

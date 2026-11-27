"use client";

import { useState } from "react";
import { COR, Ajuda, Rotulo, Sobretitulo, botaoPrimario, botaoSecundario, estiloCampo, estiloTexto } from "./ui";
import { DICAS_GANHO, GANHOS, type Formulario, type Ganho } from "@/lib/tipos";
import { ROTULOS, camposFaltando, type CampoObrigatorio } from "@/lib/validacao";

export default function PassoConta({
  form,
  setForm,
  onContinuar,
  onExemplo,
}: {
  form: Formulario;
  setForm: (patch: Partial<Formulario>) => void;
  onContinuar: () => void;
  onExemplo: () => void;
}) {
  const [mostrarErro, setMostrarErro] = useState(false);
  const [linkNovo, setLinkNovo] = useState("");

  const faltando = camposFaltando(form);
  const falta = (k: CampoObrigatorio) => mostrarErro && faltando.includes(k);
  const borda = (k: CampoObrigatorio) => (falta(k) ? COR.vermelho : COR.suave);
  const aria = (k: CampoObrigatorio) => ({ "aria-required": true as const, "aria-invalid": falta(k) || undefined });

  function continuar() {
    if (faltando.length) {
      setMostrarErro(true);
      const alvo = ROTULOS[faltando[0]][1];
      setTimeout(() => {
        const el = document.getElementById(alvo);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const foco = el.tagName === "DIV" ? el.querySelector("button") : el;
        (foco as HTMLElement | null)?.focus({ preventScroll: true });
      }, 50);
      return;
    }
    setMostrarErro(false);
    onContinuar();
  }

  function escolherPrincipal(g: Ganho) {
    setForm({ ganho: g, ganhosSec: form.ganhosSec.filter((x) => x !== g) });
  }

  function alternarSecundario(g: Ganho) {
    const sel = form.ganhosSec.includes(g);
    setForm({ ganhosSec: sel ? form.ganhosSec.filter((x) => x !== g) : [...form.ganhosSec, g] });
  }

  function adicionarLink() {
    const u = linkNovo.trim();
    if (!u) return;
    setForm({ links: [...form.links, u] });
    setLinkNovo("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Sobretitulo>PASSO 1 · VOCÊ CONTA</Sobretitulo>
        <h2 className="pz-h2" style={{ margin: 0, lineHeight: 1.2, fontWeight: 700 }}>
          Conte o problema com as suas palavras
        </h2>
        <p style={{ margin: 0, fontSize: 16, lineHeight: "24px", color: COR.suave }}>
          Os campos obrigatórios são o que o time InovAI precisa para entender o problema. Não precisa estar perfeito.
        </p>
      </div>

      {/* Problema */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Rotulo htmlFor="f-problema" obrigatorio>
          Conte o problema
        </Rotulo>
        <Ajuda id="d-problema">Do seu jeito, como contaria a um colega. Não precisa saber a causa nem a solução.</Ajuda>
        <div style={{ background: COR.fundo, borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: "20px", fontWeight: 700 }}>Para ajudar, tente contar:</p>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: "22px", color: COR.suave }}>
            <li>O que está dando errado</li>
            <li>Como você percebeu</li>
            <li>Quem sofre com isso: clientes, um time ou os dois</li>
            <li>O que acontece por causa disso</li>
          </ul>
        </div>
        <textarea
          id="f-problema"
          rows={6}
          value={form.problema}
          onChange={(e) => setForm({ problema: e.target.value })}
          placeholder="Ex.: No WhatsApp, muitos clientes desistem do agendamento da instalação porque não acham horário. Percebi pelas reclamações que chegam toda semana no backoffice."
          aria-describedby="d-problema"
          {...aria("problema")}
          style={estiloTexto(borda("problema"))}
        />
      </div>

      {/* Tamanho do problema e ganho */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 18, borderRadius: 14, border: `2px solid ${COR.suave}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: "16px", fontWeight: 700, letterSpacing: "0.12em", color: COR.vermelhoEscuro }}>TAMANHO DO PROBLEMA</p>
          <Ajuda>Com estes números já estimamos o impacto no seu canvas. Valores aproximados servem.</Ajuda>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: 8 }}>
            <Rotulo htmlFor="f-volume" obrigatorio>
              Quantas vezes acontece por mês?
            </Rotulo>
            <Ajuda id="d-volume" tamanho={13}>
              Pedidos, chamados, clientes afetados.
            </Ajuda>
            <input
              id="f-volume"
              type="text"
              inputMode="numeric"
              value={form.volume}
              onChange={(e) => setForm({ volume: e.target.value })}
              disabled={form.volNaoSei}
              aria-describedby="d-volume"
              aria-required={!form.volNaoSei}
              aria-invalid={falta("volume") || undefined}
              style={estiloCampo(form.volNaoSei ? COR.linhas : borda("volume"), { background: form.volNaoSei ? COR.fundo : "#ffffff" })}
            />
            <label
              htmlFor="f-volume-ns"
              style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 6, fontSize: 13, lineHeight: "18px", color: COR.suave, cursor: "pointer" }}
            >
              <input
                id="f-volume-ns"
                type="checkbox"
                checked={form.volNaoSei}
                onChange={(e) => setForm(e.target.checked ? { volNaoSei: true, volume: "" } : { volNaoSei: false })}
                style={{ width: 16, height: 16, accentColor: COR.vermelho, margin: 0 }}
              />
              Não sei agora
            </label>
          </div>
          <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: 8 }}>
            <Rotulo htmlFor="f-valor" obrigatorio={false}>
              Quanto custa cada caso? (R$)
            </Rotulo>
            <Ajuda id="d-valor" tamanho={13}>
              Custo de tratamento ou receita perdida por caso.
            </Ajuda>
            <input
              id="f-valor"
              type="text"
              inputMode="decimal"
              value={form.valorCaso}
              onChange={(e) => setForm({ valorCaso: e.target.value })}
              aria-describedby="d-valor"
              style={estiloCampo(COR.linhas)}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Rotulo id="l-ganho" obrigatorio>
            Que tipo de ganho você espera?
          </Rotulo>
          <p id="l-ganho-p" style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: COR.suave }}>
            <strong style={{ color: COR.tinta }}>Principal:</strong> escolha um.
          </p>
          <div id="g-ganho" role="radiogroup" aria-labelledby="l-ganho l-ganho-p" aria-required="true" aria-invalid={falta("ganho") || undefined} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {GANHOS.map((g) => {
              const sel = form.ganho === g;
              return (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => escolherPrincipal(g)}
                  style={{
                    minHeight: 44,
                    padding: "10px 18px",
                    border: `2px solid ${falta("ganho") ? COR.erro : COR.vermelho}`,
                    borderRadius: 9999,
                    background: sel ? COR.vermelho : "#ffffff",
                    color: sel ? "#ffffff" : COR.vermelhoEscuro,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
          {form.ganho && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 14px", borderLeft: `3px solid ${COR.vermelho}`, background: COR.rosa, borderRadius: "0 10px 10px 0" }}>
              <Rotulo htmlFor="f-just" obrigatorio tamanho={15}>
                Por que {form.ganho.toLowerCase()}?
              </Rotulo>
              <textarea
                id="f-just"
                rows={2}
                value={form.justPrinc}
                onChange={(e) => setForm({ justPrinc: e.target.value })}
                placeholder={DICAS_GANHO[form.ganho]}
                {...aria("justPrinc")}
                style={estiloTexto(borda("justPrinc"), { padding: "10px 12px", fontSize: 15, lineHeight: "22px" })}
              />
            </div>
          )}
          <p id="l-ganho-s" style={{ margin: "4px 0 0", fontSize: 14, lineHeight: "20px", color: COR.suave }}>
            <strong style={{ color: COR.tinta }}>Secundários:</strong> opcional, marque quantos quiser.
          </p>
          <div role="group" aria-labelledby="l-ganho l-ganho-s" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {GANHOS.filter((g) => g !== form.ganho).map((g) => {
              const sel = form.ganhosSec.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => alternarSecundario(g)}
                  style={{
                    minHeight: 40,
                    padding: "8px 16px",
                    border: `2px dashed ${sel ? COR.vermelhoEscuro : COR.cinzaBorda}`,
                    borderRadius: 9999,
                    background: sel ? COR.rosa : "#ffffff",
                    color: COR.vermelhoEscuro,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
          {form.ganhosSec.map((g, i) => (
            <div key={g} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 14px", borderLeft: `3px dashed ${COR.cinzaBorda}`, borderRadius: "0 10px 10px 0", background: COR.fundo }}>
              <Rotulo htmlFor={"f-just-sec-" + i} obrigatorio={false} tamanho={14}>
                Por que {g.toLowerCase()}?
              </Rotulo>
              <input
                id={"f-just-sec-" + i}
                type="text"
                value={form.justSec[g] || ""}
                onChange={(e) => setForm({ justSec: { ...form.justSec, [g]: e.target.value } })}
                placeholder={DICAS_GANHO[g]}
                style={estiloCampo(COR.linhas, { minHeight: 44, padding: "8px 12px", fontSize: 15 })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Outras evidências */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Rotulo obrigatorio={false}>Outras evidências</Rotulo>
        <Ajuda>Reclamações, prints, relatórios, links ou o que você já sabe sobre o tema. Use uma ou mais formas abaixo.</Ajuda>
        <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: "20px", fontWeight: 700 }}>Arquivos</p>
        <label
          htmlFor="f-arquivos"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap", minHeight: 64, padding: 14, border: `2px dashed ${COR.cinzaBorda}`, borderRadius: 10, background: "#ffffff", color: COR.vermelhoEscuro, fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "center" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M17 8l-5-5-5 5" />
            <path d="M12 3v12" />
          </svg>
          Anexar arquivos
          <span style={{ fontWeight: 400, color: COR.suave }}>Word, Excel, PDF, PowerPoint ou imagem</span>
          <input
            id="f-arquivos"
            type="file"
            multiple
            accept=".doc,.docx,.xls,.xlsx,.csv,.pdf,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp"
            onChange={(e) => {
              const novos = Array.from(e.target.files || []);
              setForm({ arquivos: [...form.arquivos, ...novos] });
              e.target.value = "";
            }}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
          />
        </label>
        {form.arquivos.length > 0 && (
          <ul style={{ display: "flex", flexWrap: "wrap", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
            {form.arquivos.map((f, i) => (
              <li key={i + f.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 6px 6px 12px", borderRadius: 9999, background: COR.fundo, fontSize: 13, lineHeight: "18px" }}>
                {f.name}
                <button
                  type="button"
                  onClick={() => setForm({ arquivos: form.arquivos.filter((_, j) => j !== i) })}
                  aria-label={"Remover " + f.name}
                  style={{ width: 28, height: 28, border: "none", borderRadius: 9999, background: "transparent", color: COR.suave, fontSize: 16 }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <label htmlFor="f-link" style={{ margin: "6px 0 0", fontSize: 14, lineHeight: "20px", fontWeight: 700 }}>
          Links
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            id="f-link"
            type="url"
            value={linkNovo}
            onChange={(e) => setLinkNovo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                adicionarLink();
              }
            }}
            placeholder="Cole um link: Figma, Confluence, SharePoint, painel..."
            style={estiloCampo(COR.linhas, { flex: "1 1 240px", minWidth: 0, width: "auto" })}
          />
          <button type="button" onClick={adicionarLink} style={{ ...botaoSecundario, borderRadius: 10, padding: "10px 20px" }}>
            Adicionar
          </button>
        </div>
        {form.links.length > 0 && (
          <ul style={{ display: "flex", flexDirection: "column", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
            {form.links.map((u, i) => (
              <li key={i + u} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 6px 6px 12px", borderRadius: 10, background: COR.fundo, fontSize: 13, lineHeight: "18px", wordBreak: "break-all" }}>
                {u}
                <button
                  type="button"
                  onClick={() => setForm({ links: form.links.filter((_, j) => j !== i) })}
                  aria-label={"Remover link " + u}
                  style={{ flex: "none", width: 28, height: 28, border: "none", borderRadius: 9999, background: "transparent", color: COR.suave, fontSize: 16 }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <label htmlFor="f-dados" style={{ margin: "6px 0 0", fontSize: 14, lineHeight: "20px", fontWeight: 700 }}>
          Dados ou observações
        </label>
        <textarea
          id="f-dados"
          rows={2}
          value={form.dados}
          onChange={(e) => setForm({ dados: e.target.value })}
          placeholder="Ex.: cerca de 200 reclamações por semana no canal X."
          style={estiloTexto(COR.linhas)}
        />
      </div>

      {/* Produto e time */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 8 }}>
          <Rotulo htmlFor="f-produto" obrigatorio>
            Produto ou jornada
          </Rotulo>
          <Ajuda id="d-produto">Onde o problema acontece.</Ajuda>
          <input id="f-produto" type="text" value={form.produto} onChange={(e) => setForm({ produto: e.target.value })} aria-describedby="d-produto" {...aria("produto")} style={estiloCampo(borda("produto"))} />
        </div>
        <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 8 }}>
          <Rotulo htmlFor="f-interessados" obrigatorio>
            Time que vai receber a solução
          </Rotulo>
          <Ajuda id="d-interessados">Qual time vai operar a solução se o experimento der certo.</Ajuda>
          <input
            id="f-interessados"
            type="text"
            value={form.interessados}
            onChange={(e) => setForm({ interessados: e.target.value })}
            aria-describedby="d-interessados"
            {...aria("interessados")}
            style={estiloCampo(borda("interessados"))}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Rotulo htmlFor="f-stakeholders" obrigatorio={false}>
          Stakeholders
        </Rotulo>
        <Ajuda id="d-stakeholders">Pessoas que precisam acompanhar ou decidir sobre o tema.</Ajuda>
        <input id="f-stakeholders" type="text" value={form.stakeholders} onChange={(e) => setForm({ stakeholders: e.target.value })} aria-describedby="d-stakeholders" style={estiloCampo(COR.linhas)} />
      </div>

      {/* Quem está enviando */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 18, borderRadius: 14, background: COR.fundo }}>
        <p style={{ margin: 0, fontSize: 12, lineHeight: "16px", fontWeight: 700, letterSpacing: "0.12em", color: COR.suave }}>QUEM ESTÁ ENVIANDO</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {(
            [
              ["nome", "f-nome", "Seu nome", "text", "name"],
              ["area", "f-area", "Sua área", "text", "organization-title"],
              ["email", "f-email", "Seu e-mail", "email", "email"],
            ] as const
          ).map(([k, id, rotulo, tipo, auto]) => (
            <div key={k} style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 8 }}>
              <Rotulo htmlFor={id} obrigatorio>
                {rotulo}
              </Rotulo>
              <input id={id} type={tipo} autoComplete={auto} value={form[k]} onChange={(e) => setForm({ [k]: e.target.value })} {...aria(k)} style={estiloCampo(borda(k))} />
            </div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", color: COR.suave }}>É para onde enviamos o canvas pré-preenchido e por onde marcamos a reunião.</p>
      </div>

      {mostrarErro && faltando.length > 0 && (
        <p role="alert" style={{ margin: 0, padding: "12px 16px", borderRadius: 10, background: COR.rosa, color: COR.erro, fontSize: 15, lineHeight: "22px", fontWeight: 700 }}>
          Faltam campos obrigatórios: {faltando.map((k) => ROTULOS[k][0]).join(", ")}.
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <button type="button" onClick={continuar} style={botaoPrimario}>
          Continuar
        </button>
        <button
          type="button"
          onClick={() => {
            setMostrarErro(false);
            onExemplo();
          }}
          style={botaoSecundario}
        >
          Preencher com exemplo
        </button>
      </div>
    </div>
  );
}

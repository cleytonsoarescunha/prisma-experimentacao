"use client";

import { useEffect, useRef, useState } from "react";
import PrismaVidro from "./PrismaVidro";
import { ConteudoInicio, HeroInicio, type EstadoConsulta } from "./Inicio";
import PassoConta from "./PassoConta";
import { PassoConfere, PassoOrganizando } from "./PassosOrganiza";
import TelaFim from "./TelaFim";
import { COR, IconeFrasco } from "./ui";
import { EXEMPLO, organizarSemIA } from "@/lib/regras";

/** E-mail do criador, para o link "Criado por" do rodapé. */
const CONTATO_CRIADOR = "cleytonsoarescunha@gmail.com";
import { FORMULARIO_VAZIO, type Demanda, type Formulario, type ItemOrganizado } from "@/lib/tipos";

type Tela = "entrada" | "conta" | "ia" | "valida" | "fim";

const ORDEM: Record<Tela, number> = { entrada: 0, conta: 1, ia: 2, valida: 3, fim: 4 };

const CAMINHO = [
  { label: "Você conta", sub: "O problema e os dados" },
  { label: "Organizamos", sub: "Nome e hipótese" },
  { label: "Você confere", sub: "Confirma ou ajusta" },
  { label: "Reunião", sub: "E entrada na esteira" },
];

const TITULO_FAIXA: Partial<Record<Tela, string>> = {
  conta: "Passo 1 · Conte o problema",
  ia: "Passo 2 · Organizando as informações",
  valida: "Passo 3 · Confira o resumo",
  fim: "Problema recebido · seu canvas está pronto",
};

export default function Prisma() {
  const [tela, setTela] = useState<Tela>("entrada");
  const [form, setFormState] = useState<Formulario>(FORMULARIO_VAZIO);
  const [itens, setItens] = useState<ItemOrganizado[]>([]);
  const [etapaEspera, setEtapaEspera] = useState(0);
  const [atual, setAtual] = useState<Demanda | null>(null);
  const [consulta, setConsulta] = useState<EstadoConsulta>({ cod: "", erro: false, res: null });
  const timers = useRef<number[]>([]);

  const setForm = (patch: Partial<Formulario>) => setFormState((f) => ({ ...f, ...patch }));

  function limparTimers() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }
  useEffect(() => limparTimers, []);

  function irPara(t: Tela) {
    setTela(t);
    window.scrollTo({ top: 0 });
  }

  async function organizar() {
    irPara("ia");
    setEtapaEspera(0);
    const inicio = Date.now();
    // As duas primeiras etapas da espera andam sozinhas; a terceira só termina quando a organização chega.
    [800, 1600].forEach((ms, i) => {
      timers.current.push(window.setTimeout(() => setEtapaEspera((e) => Math.max(e, i + 1)), ms));
    });

    let resultado: ItemOrganizado[];
    try {
      // Só o relato vai para a organização: nome, área, e-mail, stakeholders, links e anexos ficam de fora.
      const relato = {
        problema: form.problema,
        volume: form.volume,
        volNaoSei: form.volNaoSei,
        valorCaso: form.valorCaso,
        valorNaoSei: form.valorNaoSei,
        ganho: form.ganho,
        ganhosSec: form.ganhosSec,
        justPrinc: form.justPrinc,
        justSec: form.justSec,
        dados: form.dados,
        produto: form.produto,
        interessados: form.interessados,
        usouExemplo: form.usouExemplo,
      };
      const resposta = await fetch("/api/organizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: relato }),
      });
      const corpo = await resposta.json();
      if (!resposta.ok || !Array.isArray(corpo.itens)) throw new Error(corpo.erro || "Resposta inválida");
      resultado = corpo.itens;
    } catch {
      // Sem conexão com o servidor: organiza aqui mesmo, com as regras sem IA.
      resultado = organizarSemIA(form);
    }
    setItens(resultado);

    // Mostra as 3 etapas por pelo menos 3 segundos no total, mesmo quando a resposta é rápida.
    const passou = Date.now() - inicio;
    timers.current.push(window.setTimeout(() => setEtapaEspera(3), Math.max(0, 2400 - passou)));
    timers.current.push(window.setTimeout(() => irPara("valida"), Math.max(400, 3000 - passou)));
  }

  /** Envia para o servidor, que grava no banco e devolve o código. Devolve uma mensagem de erro, se houver. */
  async function enviar(): Promise<string | null> {
    const dados = new FormData();
    const { arquivos, ...semArquivos } = form;
    dados.set("dados", JSON.stringify({ form: semArquivos, itens: itens.map((x) => ({ id: x.id, texto: x.texto })) }));
    arquivos.forEach((a) => dados.append("anexos", a));

    let resposta: Response;
    try {
      resposta = await fetch("/api/demandas", { method: "POST", body: dados });
    } catch {
      return "Sem conexão com o servidor. Confira a internet e tente de novo.";
    }
    const corpo = await resposta.json().catch(() => ({}));
    if (!resposta.ok || !corpo.codigo) return corpo.erro || "Não foi possível enviar agora. Tente de novo em instantes.";

    setAtual({
      codigo: corpo.codigo,
      enviadoEm: new Date(),
      form,
      itens,
      etapa: 0,
      anexosComFalha: corpo.anexosComFalha || [],
      assinaturaPdf: corpo.assinaturaPdf,
      emailEnviado: corpo.emailEnviado === true,
    });
    irPara("fim");
    return null;
  }

  async function consultar() {
    const c = consulta.cod.trim().toUpperCase();
    if (!/^PR-\d{4}-\d{4,}$/.test(c)) {
      setConsulta({ cod: c, erro: true, res: null });
      return;
    }
    try {
      const resposta = await fetch("/api/demandas/" + encodeURIComponent(c));
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        setConsulta({ cod: c, erro: true, res: null, mensagem: resposta.status === 404 ? undefined : corpo.erro });
        return;
      }
      setConsulta({
        cod: c,
        erro: false,
        res: {
          codigo: corpo.codigo,
          passo: corpo.passo,
          esteira: corpo.esteira,
          nota: corpo.passo === 0 ? "Recebemos seu problema. O time InovAI vai entrar em contato para agendar a reunião inicial." : "",
        },
      });
    } catch {
      setConsulta({ cod: c, erro: true, res: null, mensagem: "Sem conexão com o servidor. Tente de novo." });
    }
  }

  function recomecar() {
    limparTimers();
    setFormState(FORMULARIO_VAZIO);
    setItens([]);
    irPara("conta");
  }

  function irInicio() {
    limparTimers();
    irPara("entrada");
  }

  const n = ORDEM[tela];
  const passos = CAMINHO.map((d, i) => {
    const num = i + 1;
    const feito = n > num;
    const ativo = n === num;
    return { ...d, num, feito, ativo };
  });

  return (
    <div className="pz-app">
      <header style={{ background: "#ffffff", borderBottom: `1px solid ${COR.linhas}`, flex: "none" }}>
        <div className="pz-x" style={{ maxWidth: 1240, margin: "0 auto", paddingTop: 14, paddingBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <button
            type="button"
            onClick={irInicio}
            aria-label="Ir para a página inicial do Prisma"
            style={{ display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", padding: 0, margin: 0, textAlign: "left", color: COR.tinta }}
          >
            <PrismaVidro className="pz-simbolo" style={{ flex: "none" }} />
            <span style={{ display: "flex", flexDirection: "column" }}>
              <span className="pz-marca" style={{ lineHeight: 1.15, fontWeight: 700, letterSpacing: "-0.01em" }}>
                Prisma <span style={{ color: COR.vermelho }}>de Experimentação</span>
              </span>
              <span style={{ fontSize: 12, lineHeight: "16px", color: COR.suave }}>Time InovAI · CoE Digital</span>
            </span>
          </button>
        </div>
      </header>

      <section style={{ background: COR.vermelho, color: "#ffffff", flex: "none" }}>
        {tela === "entrada" ? (
          <HeroInicio
            consulta={consulta}
            onCod={(v) => setConsulta({ ...consulta, cod: v, erro: false })}
            onConsultar={consultar}
            onComecar={() => irPara("conta")}
          />
        ) : (
          <div className="pz-x" style={{ maxWidth: 1240, margin: "0 auto", paddingTop: 22, paddingBottom: 22, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", color: COR.amarelo }}>TIME INOVAI · EXPERIMENTAÇÃO</span>
            <h1 className="pz-banda" style={{ margin: 0, lineHeight: 1.2, fontWeight: 700 }}>
              {TITULO_FAIXA[tela]}
            </h1>
          </div>
        )}
      </section>

      {tela !== "entrada" && (
        <ol aria-label="Seu caminho no Prisma" className="so-mob" style={{ gap: 6, padding: "14px 16px 0 16px", margin: 0, listStyle: "none", flex: "none", background: "#ffffff" }}>
          {passos.map((s) => (
            <li key={s.label} aria-current={s.ativo ? "step" : undefined} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ height: 6, borderRadius: 3, background: s.feito || s.ativo ? COR.vermelho : COR.linhas }} />
              <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 700, color: s.feito || s.ativo ? COR.tinta : COR.suave }}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="pz-wrap" style={{ width: "100%", maxWidth: 1240, margin: "0 auto", flex: 1 }}>
        <div className="pz-cartao" style={{ background: "#ffffff", border: `1px solid ${COR.linhas}`, overflow: "hidden", display: "flex", flexDirection: "row", minHeight: 0 }}>
          {tela !== "entrada" && (
            <aside className="so-desk" style={{ width: 300, flex: "none", background: COR.fundo, padding: "36px 28px", display: "flex", flexDirection: "column", gap: 32 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", fontWeight: 700, letterSpacing: "0.12em", color: COR.suave }}>SEU CAMINHO NO PRISMA</p>
                <ol style={{ display: "flex", flexDirection: "column", gap: 20, listStyle: "none", padding: 0, margin: 0 }}>
                  {passos.map((s) => (
                    <li key={s.label} aria-current={s.ativo ? "step" : undefined} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div
                        aria-hidden="true"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9999,
                          border: `2px solid ${s.feito || s.ativo ? COR.vermelho : COR.cinzaBorda}`,
                          background: s.feito ? COR.vermelho : "#ffffff",
                          color: s.feito ? "#ffffff" : s.ativo ? COR.vermelho : COR.suave,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 15,
                          fontWeight: 700,
                          flex: "none",
                        }}
                      >
                        {s.feito ? "✓" : s.num}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <p style={{ margin: 0, fontSize: 16, lineHeight: "20px", fontWeight: 700, color: s.feito || s.ativo ? COR.tinta : COR.suave }}>
                          {s.label}
                          {s.feito && <span className="sr-only"> (concluído)</span>}
                        </p>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", color: COR.suave }}>{s.sub}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 24, borderTop: `2px solid ${COR.linhas}` }}>
                <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", fontWeight: 700, letterSpacing: "0.12em", color: COR.suave }}>COMO LER OS CAMPOS</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 20, border: `2px solid ${COR.suave}`, borderRadius: 6, background: "#ffffff", flex: "none" }} />
                  <p style={{ margin: 0, fontSize: 14, lineHeight: "18px" }}>Você preenche (obrigatório)</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 20, border: `2px dashed ${COR.vermelho}`, borderRadius: 6, background: COR.rosa, flex: "none" }} />
                  <p style={{ margin: 0, fontSize: 14, lineHeight: "18px" }}>Nós organizamos, você confere</p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: "19px", color: COR.suave }}>
                Depois da reunião, o time InovAI leva o problema pela esteira de experimentação: mapeamento, desenho da solução, protótipo e testes.
              </p>
            </aside>
          )}

          <main className="pz-main" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ maxWidth: 820, display: "flex", flexDirection: "column", gap: 24 }}>
              {tela === "entrada" && (
                <ConteudoInicio consulta={consulta} onCod={(v) => setConsulta({ ...consulta, cod: v, erro: false })} onConsultar={consultar} />
              )}
              {tela === "conta" && <PassoConta form={form} setForm={setForm} onContinuar={organizar} onExemplo={() => setForm(EXEMPLO)} />}
              {tela === "ia" && <PassoOrganizando etapa={etapaEspera} />}
              {tela === "valida" && (
                <PassoConfere problema={form.problema} itens={itens} onItens={setItens} onEditarRelato={() => irPara("conta")} onEnviar={enviar} />
              )}
              {tela === "fim" && atual && <TelaFim demanda={atual} onRecomecar={recomecar} />}
            </div>
          </main>
        </div>
      </div>

      <footer className="pz-x" style={{ width: "100%", maxWidth: 1240, margin: "0 auto", paddingTop: 8, paddingBottom: 36, flex: "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", borderTop: `1px solid ${COR.linhas}`, paddingTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 44, height: 44, background: COR.vermelho, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconeFrasco />
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.08em", color: COR.vermelhoEscuro }}>EXPERIMENTAÇÃO</span>
                <span style={{ width: 1, height: 20, background: COR.cinzaBorda, margin: "0 14px" }} />
                <span style={{ fontSize: 15, color: COR.suave }}>CoE Digital</span>
              </div>
              <div style={{ width: 90, height: 3, background: "linear-gradient(90deg, #e2262b, rgba(226,38,43,0))" }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, textAlign: "right" }}>
            <span style={{ fontSize: 13, color: COR.suave }}>Os problemas recebidos entram na esteira de experimentação do time InovAI</span>
            <span style={{ fontSize: 13, color: COR.suave }}>
              Criado por{" "}
              <a
                href={"mailto:" + CONTATO_CRIADOR + "?subject=" + encodeURIComponent("Contato sobre o Prisma de Experimentação")}
                title="Enviar um e-mail para o criador do Prisma"
                style={{ color: COR.vermelhoEscuro, fontWeight: 700 }}
              >
                Cleyton Cunha
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

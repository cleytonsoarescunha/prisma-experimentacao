"use client";

// Peças da área do time InovAI: moldura da página, formulário de entrada, lista de demandas e mudança de situação.

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import PrismaVidro from "./PrismaVidro";
import Rodape from "./Rodape";
import { COR, botaoPrimario, botaoSecundario, estiloCampo } from "./ui";
import { SITUACOES_DEMANDA, descreverSituacao } from "@/lib/tipos";

/** Moldura das páginas do time: cabeçalho com o nome da área, quem está conectado e o botão Sair. */
export function MolduraTime({ email, children }: { email?: string | null; children: ReactNode }) {
  const [saindo, setSaindo] = useState(false);
  async function sair() {
    setSaindo(true);
    await fetch("/api/inovai/sair", { method: "POST" }).catch(() => {});
    // Recarrega do zero, para não sobrar na memória do navegador nenhuma página com dados das demandas.
    window.location.replace(new URL("/inovai/entrar", window.location.origin).toString());
  }
  return (
    <div style={{ minHeight: "100vh", background: COR.fundo, display: "flex", flexDirection: "column" }}>
      {/* Mesma barra superior do site: o prisma de vidro e o nome do Prisma, com "Área restrita" ao lado. */}
      <header style={{ background: "#ffffff", borderBottom: `1px solid ${COR.linhas}`, flex: "none" }}>
        <div className="pz-x" style={{ maxWidth: 1240, margin: "0 auto", paddingTop: 14, paddingBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Link href="/" aria-label="Ir para a página inicial do Prisma" style={{ display: "flex", alignItems: "center", gap: 12, color: COR.tinta, textDecoration: "none" }}>
            <PrismaVidro className="pz-simbolo" style={{ flex: "none" }} />
            <span style={{ display: "flex", flexDirection: "column" }}>
              <span className="pz-marca" style={{ lineHeight: 1.15, fontWeight: 700, letterSpacing: "-0.01em" }}>
                Prisma <span style={{ color: COR.vermelho }}>de Experimentação</span>
              </span>
              <span style={{ fontSize: 12, lineHeight: "16px", color: COR.suave }}>Time InovAI · CoE Digital</span>
            </span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {email && (
              <>
                <span className="so-desk" style={{ fontSize: 14, color: COR.suave, overflowWrap: "anywhere" }}>
                  {email}
                </span>
                <button
                  type="button"
                  onClick={sair}
                  disabled={saindo}
                  style={{ minHeight: 40, padding: "8px 16px", border: "none", borderRadius: 9999, background: "transparent", color: COR.vermelhoEscuro, fontSize: 14, fontWeight: 700, textDecoration: "underline" }}
                >
                  {saindo ? "Saindo..." : "Sair"}
                </button>
              </>
            )}
            {/* Mesmo botão e mesmo lugar do site; aqui fica preenchido, indicando que você está na área restrita. */}
            <Link
              href="/inovai"
              aria-current="page"
              aria-label="Área restrita (você está aqui)"
              title="Área restrita"
              className="pz-restrita"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 40, minWidth: 40, border: `2px solid ${COR.vermelho}`, borderRadius: 9999, background: COR.vermelho, color: "#ffffff", fontSize: 14, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", flex: "none" }}
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <span className="pz-restrita-texto">Área restrita</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="pz-x" style={{ width: "100%", maxWidth: 1240, margin: "0 auto", padding: "28px 0 48px", boxSizing: "border-box", flex: 1 }}>
        {children}
      </main>
      <Rodape />
    </div>
  );
}

/** Formulário "Entrar": pede o link de acesso por e-mail. */
export function FormEntrar({ erroLink }: { erroLink: boolean }) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<{ tipo: "" | "ok" | "erro"; texto: string }>(
    erroLink ? { tipo: "erro", texto: "Este link de acesso não vale mais (já foi usado ou venceu). Peça um novo abaixo." } : { tipo: "", texto: "" },
  );
  const [enviando, setEnviando] = useState(false);
  /** Já pediu o link pelo menos uma vez (aí o botão vira "Reenviar link"). */
  const [enviou, setEnviou] = useState(false);
  /** Segundos que faltam para poder pedir de novo. */
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    if (espera <= 0) return;
    const t = window.setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [espera]);

  async function pedir(e?: React.FormEvent) {
    e?.preventDefault();
    if (espera > 0 || enviando) return;
    setEnviando(true);
    try {
      const r = await fetch("/api/inovai/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const corpo = await r.json().catch(() => ({}));
      if (typeof corpo.espera === "number") setEspera(corpo.espera);
      if (r.ok) setEnviou(true);
      setEstado(r.ok ? { tipo: "ok", texto: corpo.mensagem } : { tipo: "erro", texto: corpo.erro || "Não foi possível pedir o link agora." });
    } catch {
      setEstado({ tipo: "erro", texto: "Sem conexão com o servidor. Tente de novo." });
    }
    setEnviando(false);
  }

  const rotuloBotao = enviando ? "Enviando..." : espera > 0 ? `Reenviar link em ${espera} s` : enviou ? "Reenviar link" : "Enviar link de acesso";

  return (
    <form onSubmit={pedir} style={{ maxWidth: 480, background: "#ffffff", border: `1px solid ${COR.linhas}`, borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 style={{ margin: 0, fontSize: 26, lineHeight: "32px" }}>Entrar</h1>
      <p style={{ margin: 0, fontSize: 15, lineHeight: "22px", color: COR.suave }}>
        Área só para o time InovAI. Digite o seu e-mail e enviaremos um link de acesso, sem senha.
      </p>
      <label htmlFor="f-entrar-email" style={{ fontSize: 15, fontWeight: 700 }}>
        Seu e-mail
      </label>
      <input
        id="f-entrar-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          // Outro e-mail: volta a ser um primeiro envio (o servidor ainda controla o tempo por e-mail).
          setEnviou(false);
        }}
        style={estiloCampo(COR.suave)}
      />
      <button
        type="submit"
        disabled={enviando || espera > 0}
        aria-live="polite"
        style={{ ...(espera > 0 ? botaoSecundario : botaoPrimario), alignSelf: "flex-start", opacity: espera > 0 ? 0.7 : 1, cursor: espera > 0 ? "not-allowed" : "pointer" }}
      >
        {rotuloBotao}
      </button>
      {enviou && (
        <p style={{ margin: 0, fontSize: 13, lineHeight: "19px", color: COR.suave }}>
          Não chegou? Confira o spam e a quarentena do e-mail da empresa. Você pode pedir um novo link a cada 1 minuto; o link mais recente é o que vale.
        </p>
      )}
      {estado.tipo && (
        <p role={estado.tipo === "erro" ? "alert" : "status"} style={{ margin: 0, padding: "12px 14px", borderRadius: 10, fontSize: 14, lineHeight: "20px", fontWeight: 700, background: estado.tipo === "erro" ? COR.rosa : "#eef7ee", color: estado.tipo === "erro" ? COR.erro : "#1d5e20" }}>
          {estado.texto}
        </p>
      )}
      <Link href="/" style={{ fontSize: 14, color: COR.vermelhoEscuro, fontWeight: 700 }}>
        Voltar para a página inicial
      </Link>
    </form>
  );
}

/**
 * Página aberta pelo link do e-mail. O acesso só é liberado no clique do botão:
 * os robôs de segurança dos e-mails das empresas abrem os links para conferir, mas não apertam botões,
 * e assim não gastam o link de uso único antes da pessoa.
 */
export function ConfirmarEntrada({ token }: { token: string }) {
  const [entrando, setEntrando] = useState(false);
  return (
    <form
      method="post"
      action="/api/inovai/entrar"
      onSubmit={() => setEntrando(true)}
      style={{ maxWidth: 480, background: "#ffffff", border: `1px solid ${COR.linhas}`, borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 14 }}
    >
      <h1 style={{ margin: 0, fontSize: 26, lineHeight: "32px" }}>Entrar na área restrita</h1>
      <p style={{ margin: 0, fontSize: 15, lineHeight: "22px", color: COR.suave }}>
        Clique no botão para entrar. O acesso fica guardado neste navegador por 7 dias.
      </p>
      <input type="hidden" name="token" value={token} />
      <button type="submit" disabled={entrando} style={{ ...botaoPrimario, alignSelf: "flex-start", cursor: entrando ? "wait" : "pointer" }}>
        {entrando ? "Entrando..." : "Entrar na área restrita"}
      </button>
      <Link href="/" style={{ fontSize: 14, color: COR.vermelhoEscuro, fontWeight: 700 }}>
        Voltar para a página inicial
      </Link>
    </form>
  );
}

export interface LinhaDemanda {
  codigo: string;
  enviadoEm: string;
  nomeSolucao: string;
  nome: string;
  area: string;
  produto: string;
  situacao: string;
}

/** Lista de demandas com filtro por situação. */
export function ListaDemandas({ linhas }: { linhas: LinhaDemanda[] }) {
  const [filtro, setFiltro] = useState("");
  const visiveis = useMemo(() => (filtro ? linhas.filter((l) => l.situacao === filtro) : linhas), [filtro, linhas]);
  const contagem = (s: string) => linhas.filter((l) => l.situacao === s).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: "34px" }}>Demandas</h1>
          <p style={{ margin: "4px 0 0", fontSize: 15, color: COR.suave }}>
            {linhas.length} {linhas.length === 1 ? "demanda recebida" : "demandas recebidas"}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="f-filtro" style={{ fontSize: 14, fontWeight: 700 }}>
            Filtrar por situação
          </label>
          <select id="f-filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ ...estiloCampo(COR.suave), minWidth: 280 }}>
            <option value="">Todas ({linhas.length})</option>
            {SITUACOES_DEMANDA.map((s) => (
              <option key={s} value={s}>
                {descreverSituacao(s)} ({contagem(s)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {visiveis.length === 0 ? (
        <p style={{ margin: 0, padding: 24, background: "#ffffff", borderRadius: 12, border: `1px solid ${COR.linhas}`, color: COR.suave }}>Nenhuma demanda nesta situação.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {visiveis.map((l) => (
            <li key={l.codigo}>
              <Link
                href={`/inovai/${l.codigo}`}
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "6px 18px", alignItems: "center", padding: "14px 18px", background: "#ffffff", border: `1px solid ${COR.linhas}`, borderRadius: 12, color: COR.tinta, textDecoration: "none" }}
              >
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <strong style={{ color: COR.vermelhoEscuro, fontSize: 16 }}>{l.codigo}</strong>
                  <span style={{ fontSize: 13, color: COR.suave }}>{new Date(l.enviadoEm).toLocaleDateString("pt-BR")}</span>
                </span>
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <strong style={{ fontSize: 16 }}>{l.nomeSolucao}</strong>
                  <span style={{ fontSize: 13, color: COR.suave }}>{l.produto}</span>
                </span>
                <span style={{ display: "flex", flexDirection: "column", fontSize: 14 }}>
                  <span>{l.nome}</span>
                  <span style={{ fontSize: 13, color: COR.suave }}>{l.area}</span>
                </span>
                <span style={{ justifySelf: "start", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 9999, background: COR.rosa, color: COR.vermelhoEscuro }}>
                  {descreverSituacao(l.situacao)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Seletor para mudar a situação da demanda; grava no banco com o histórico. */
export function MudarSituacao({ codigo, atual }: { codigo: string; atual: string }) {
  const router = useRouter();
  const [nova, setNova] = useState(atual);
  const [estado, setEstado] = useState<{ tipo: "" | "ok" | "erro"; texto: string }>({ tipo: "", texto: "" });
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    setEstado({ tipo: "", texto: "" });
    try {
      const r = await fetch(`/api/inovai/demandas/${encodeURIComponent(codigo)}/situacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situacao: nova }),
      });
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) setEstado({ tipo: "erro", texto: corpo.erro || "Não foi possível salvar." });
      else {
        setEstado({ tipo: "ok", texto: "Situação atualizada." });
        router.refresh();
      }
    } catch {
      setEstado({ tipo: "erro", texto: "Sem conexão com o servidor." });
    }
    setSalvando(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label htmlFor="f-situacao" style={{ fontSize: 14, fontWeight: 700 }}>
        Mudar para
      </label>
      <select id="f-situacao" value={nova} onChange={(e) => setNova(e.target.value)} style={estiloCampo(COR.suave)}>
        {SITUACOES_DEMANDA.map((s) => (
          <option key={s} value={s}>
            {descreverSituacao(s)}
          </option>
        ))}
      </select>
      <button type="button" onClick={salvar} disabled={salvando || nova === atual} style={{ ...(nova === atual ? botaoSecundario : botaoPrimario), alignSelf: "flex-start", opacity: nova === atual ? 0.6 : 1 }}>
        {salvando ? "Salvando..." : "Salvar situação"}
      </button>
      {estado.tipo && (
        <p role={estado.tipo === "erro" ? "alert" : "status"} style={{ margin: 0, fontSize: 14, fontWeight: 700, color: estado.tipo === "erro" ? COR.erro : "#1d5e20" }}>
          {estado.texto}
        </p>
      )}
    </div>
  );
}

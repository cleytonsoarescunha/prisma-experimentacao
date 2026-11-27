// Ponto único de toda chamada de IA do Prisma (só roda no servidor).
// Quem usa só conhece a função organizarRelato; o fornecedor fica escondido aqui.
// Para trocar de fornecedor (por exemplo, para o Claude): crie outra função com a mesma
// assinatura de "Fornecedor", registre em FORNECEDORES e mude IA_FORNECEDOR no .env.local.
// Se a IA falhar, demorar ou devolver algo fora das regras, entram as regras sem IA (lib/regras.ts).

import "server-only";
import { organizarSemIA, PF, TITULOS } from "./regras";
import type { Formulario, IdItem, ItemOrganizado } from "./tipos";

/** O que a IA recebe: só o necessário para organizar o relato. Sem nome, área, e-mail, stakeholders, anexos ou links. */
export interface EntradaIA {
  problema: string;
  volumeMes: string;
  custoPorCaso: string;
  ganhoPrincipal: string;
  porQueGanhoPrincipal: string;
  ganhosSecundarios: { ganho: string; porQue: string }[];
  observacoes: string;
  produtoOuJornada: string;
  timeRecebedor: string;
}

/** Resposta bruta, antes da conferência. */
interface RespostaIA {
  resumo?: unknown;
  nome?: unknown;
  hipotese?: unknown;
  riscos?: unknown;
}

type Fornecedor = (instrucoes: string, entrada: EntradaIA) => Promise<RespostaIA>;

export type Origem = "ia" | "ia-parcial" | "regras";

/**
 * Tempo máximo somando todas as tentativas de IA; depois disso entram as regras.
 * A hospedagem (Netlify, plano grátis) encerra cada ação do servidor em 10 segundos, então fica abaixo disso.
 */
const TEMPO_MAXIMO_MS = 8500;

/** Nomes oficiais do portfólio: quando o tema bate, a IA deve usar exatamente estes. */
const PORTFOLIO = ["Match HP", "Validador de Documentos", "Agente de Agendamento", "Agente de Suporte", "Buscador de Produtos"];

const INSTRUCOES = `Você ajuda o time InovAI (time de experimentação) a organizar problemas de negócio contados por pessoas de outras áreas.
Você recebe o relato e devolve, em JSON, quatro itens que a pessoa vai conferir. Escreva em português do Brasil, com linguagem objetiva e simples. Nunca use travessão (—); use dois-pontos, vírgula ou ponto.

1. resumo: uma frase curta e completa que descreve o PROBLEMA (o que está dando errado e com quem), nunca a solução. Não comece com verbos de solução como "automatizar", "criar" ou "implementar". No máximo 110 caracteres, sem reticências e sem ponto final. Ela vira o subtítulo do canvas.

2. nome: o nome da solução. Misture criatividade com clareza: ao ler, já dá para entender o que a solução faz (exemplos de estilo: "Fatura Clara", "Fila Zero"). No máximo 4 palavras.
   Se o problema cair no tema de uma solução que já existe no portfólio, use exatamente o nome oficial dela, sem inventar outro:
   - endereço ou CEP: "Match HP"
   - documentos: "Validador de Documentos"
   - agendamento ou instalação: "Agente de Agendamento"
   - dúvidas ou atendimento: "Agente de Suporte"
   - escolha de planos ou ofertas: "Buscador de Produtos"
   Fora desses temas, crie sempre um nome novo. Nunca deixe o nome vazio nem devolva "${PF}": mesmo com um relato vago, dê um nome claro a partir do que foi contado (o produto, o time ou o ganho esperado).

3. hipotese: uma frase no formato "Acredito que [ação], porque [razão], o que resultará em [resultado mensurável]."
   Comece exatamente com "Acredito que" e use exatamente "porque" e "o que resultará em". Se houver volume por mês, cite os casos por mês no resultado (por exemplo: "entre os cerca de 3.000 casos por mês"). Não invente números que não estão no relato.

4. riscos: lista com 3 ou 4 riscos iniciais, cada um uma frase curta começando pelo tipo e dois-pontos. Tipos permitidos: "Técnico", "Negócio", "Operacional", "Adoção". Exemplo: "Técnico: a base de endereços pode estar desatualizada."

Não proponha a solução em detalhe: a proposta é definida depois, com o time InovAI. Use apenas o que está no relato.`;

const ESQUEMA = {
  type: "OBJECT",
  properties: {
    resumo: { type: "STRING" },
    nome: { type: "STRING" },
    hipotese: { type: "STRING" },
    riscos: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["resumo", "nome", "hipotese", "riscos"],
  propertyOrdering: ["resumo", "nome", "hipotese", "riscos"],
};

/**
 * Modelos do Gemini, em ordem de preferência. Se um falhar (sobrecarga, limite, demora), tenta o próximo.
 * Pode ser trocado em GEMINI_MODELO no .env.local, com nomes separados por vírgula.
 */
const MODELOS_PADRAO = "gemini-3.1-flash-lite, gemini-3.8-flash";
/** Prazo de cada tentativa. O último modelo ganha mais tempo, porque depois dele só restam as regras. */
const PRAZO_POR_MODELO_MS = 5500;

/** Gemini (Google AI Studio), pela API REST. A chave fica só no servidor. */
const gemini: Fornecedor = async (instrucoes, entrada) => {
  const chave = process.env.GEMINI_API_KEY?.trim();
  if (!chave) throw new Error("GEMINI_API_KEY não configurada");
  const modelos = (process.env.GEMINI_MODELO?.trim() || MODELOS_PADRAO).split(",").map((m) => m.trim()).filter(Boolean);
  let ultimoErro: unknown = null;
  for (let i = 0; i < modelos.length; i++) {
    const prazo = i === modelos.length - 1 ? TEMPO_MAXIMO_MS - PRAZO_POR_MODELO_MS * i : PRAZO_POR_MODELO_MS;
    try {
      return await chamarGemini(chave, modelos[i], instrucoes, entrada, Math.max(2000, prazo));
    } catch (e) {
      ultimoErro = e;
      console.warn(`[ia] modelo ${modelos[i]} falhou:`, e instanceof Error ? e.message : e);
    }
  }
  throw ultimoErro ?? new Error("nenhum modelo configurado");
};

async function chamarGemini(chave: string, modelo: string, instrucoes: string, entrada: EntradaIA, prazoMs: number): Promise<RespostaIA> {
  const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
    signal: AbortSignal.timeout(prazoMs),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instrucoes }] },
      contents: [{ role: "user", parts: [{ text: "Relato em JSON:\n" + JSON.stringify(entrada, null, 2) }] }],
      generationConfig: { temperature: 0.4, responseMimeType: "application/json", responseSchema: ESQUEMA },
    }),
  });
  if (!resposta.ok) {
    // Não registra o corpo da resposta inteiro: só o código e a mensagem curta.
    const corpo = await resposta.json().catch(() => ({}));
    throw new Error(`Gemini respondeu ${resposta.status}: ${String(corpo?.error?.message || "").slice(0, 200)}`);
  }
  const dados = await resposta.json();
  const texto: string = (dados?.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("");
  if (!texto) throw new Error("Gemini não devolveu texto (motivo: " + (dados?.candidates?.[0]?.finishReason || "desconhecido") + ")");
  return JSON.parse(texto) as RespostaIA;
}

const FORNECEDORES: Record<string, Fornecedor> = { gemini };

/** Monta o que vai para a IA a partir do formulário, deixando de fora os dados pessoais. */
export function entradaDoFormulario(f: Formulario): EntradaIA {
  return {
    problema: f.problema.trim(),
    volumeMes: f.volNaoSei ? "a pessoa ainda não sabe" : f.volume.trim(),
    custoPorCaso: f.valorNaoSei || !f.valorCaso.trim() ? "a pessoa ainda não sabe" : "R$ " + f.valorCaso.trim(),
    ganhoPrincipal: f.ganho,
    porQueGanhoPrincipal: f.justPrinc.trim(),
    ganhosSecundarios: f.ganhosSec.map((g) => ({ ganho: g, porQue: (f.justSec[g] || "").trim() })),
    observacoes: f.dados.trim(),
    produtoOuJornada: f.produto.trim(),
    timeRecebedor: f.interessados.trim(),
  };
}

// ---------- Conferência da resposta: cada item fora da regra é trocado pelo das regras sem IA ----------

const semTravessao = (t: string) => t.replace(/\s*[—–]\s*/g, ", ");
const limpar = (v: unknown) => (typeof v === "string" ? semTravessao(v.replace(/\s+/g, " ").trim()) : "");

function conferirResumo(v: unknown): string | null {
  let t = limpar(v).replace(/^["“]|["”]$/g, "");
  t = t.replace(/(\.\.\.|…)+$/g, "").replace(/\.$/, "").trim();
  if (t.length < 15 || t.length > 130 || /\.\.\.|…/.test(t)) return null;
  return t;
}

function conferirNome(v: unknown): string | null {
  const t = limpar(v).replace(/^["“]|["”]$/g, "").replace(/\.$/, "");
  // O nome nunca pode ficar em aberto: se a IA não der um nome válido, entra o das regras sem IA.
  if (!t || t.startsWith("[")) return null;
  const oficial = PORTFOLIO.find((p) => p.toLowerCase() === t.toLowerCase());
  if (oficial) return oficial;
  if (t.length > 40 || t.split(" ").length > 5 || /acredito/i.test(t)) return null;
  return t;
}

function conferirHipotese(v: unknown): string | null {
  let t = limpar(v);
  if (!/^Acredito que /.test(t) || !/ porque /.test(t) || !/ o que resultará em /.test(t)) return null;
  // Formato: "Acredito que [ação], porque [razão], o que resultará em [resultado]." Garante as vírgulas.
  t = t.replace(/([^,]) porque /, "$1, porque ").replace(/([^,]) o que resultará em /, "$1, o que resultará em ");
  if (t.length > 600) return null;
  if (!/[.!]$/.test(t)) t += ".";
  return t;
}

const TIPOS_RISCO: Record<string, string> = { tecnico: "Técnico", negocio: "Negócio", operacional: "Operacional", adocao: "Adoção" };

function conferirRiscos(v: unknown): string | null {
  const lista = Array.isArray(v) ? v : typeof v === "string" ? v.split("\n") : [];
  const linhas: string[] = [];
  for (const bruto of lista) {
    const t = limpar(bruto).replace(/^[-•*\d.)\s]+/, "");
    const m = t.match(/^([A-Za-zÀ-ú]+)\s*:\s*(.+)$/);
    if (!m) return null;
    const chave = m[1].normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const tipo = TIPOS_RISCO[chave];
    if (!tipo || m[2].length < 8) return null;
    linhas.push(`${tipo}: ${m[2]}${/[.!?]$/.test(m[2]) ? "" : "."}`);
  }
  if (linhas.length < 3 || linhas.length > 4) return null;
  return linhas.join("\n");
}

const CONFERIR: Record<IdItem, (v: unknown) => string | null> = {
  resumo: conferirResumo,
  nome: conferirNome,
  hipotese: conferirHipotese,
  riscos: conferirRiscos,
};

/**
 * Organiza o relato em resumo, nome, hipótese e riscos.
 * Nunca falha: se a IA não responder, ou responder fora das regras, usa as regras sem IA.
 */
export async function organizarRelato(form: Formulario): Promise<{ itens: ItemOrganizado[]; origem: Origem }> {
  const plantao = organizarSemIA(form);
  const nomeFornecedor = (process.env.IA_FORNECEDOR || "gemini").trim().toLowerCase();
  const fornecedor = FORNECEDORES[nomeFornecedor];
  if (!fornecedor) {
    console.warn(`[ia] fornecedor "${nomeFornecedor}" desconhecido; usando as regras sem IA.`);
    return { itens: plantao, origem: "regras" };
  }

  let resposta: RespostaIA;
  try {
    resposta = await fornecedor(INSTRUCOES, entradaDoFormulario(form));
  } catch (e) {
    console.warn("[ia] falhou; usando as regras sem IA.", e instanceof Error ? e.message : e);
    return { itens: plantao, origem: "regras" };
  }

  let trocados = 0;
  const itens = plantao.map((p) => {
    const conferido = CONFERIR[p.id](resposta[p.id as keyof RespostaIA]);
    if (conferido === null) {
      trocados++;
      console.warn(`[ia] item "${TITULOS[p.id]}" fora da regra; usando o das regras sem IA.`);
      return p;
    }
    return { ...p, texto: conferido };
  });
  if (trocados === itens.length) return { itens, origem: "regras" };
  return { itens, origem: trocados ? "ia-parcial" : "ia" };
}

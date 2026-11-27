// Recebe uma demanda nova: grava no banco (que gera o código) e guarda os anexos no Storage.

import { num } from "@/lib/regras";
import { ConfiguracaoFaltando, PASTA_ANEXOS, supabaseServidor } from "@/lib/supabase-servidor";
import { FORMULARIO_VAZIO, GANHOS, type Formulario, type Ganho, type IdItem } from "@/lib/tipos";
import { ROTULOS, camposFaltando } from "@/lib/validacao";

const MAX_ARQUIVOS = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const EXTENSOES = ["doc", "docx", "xls", "xlsx", "csv", "pdf", "ppt", "pptx", "png", "jpg", "jpeg", "gif", "webp"];
const MAX_TEXTO = 20000;
const IDS: IdItem[] = ["resumo", "nome", "hipotese", "riscos"];

function erro(mensagem: string, status = 400) {
  return Response.json({ erro: mensagem }, { status });
}

/** Deixa o nome do arquivo seguro para o Storage: sem acento, espaço ou símbolo estranho. */
function nomeSeguro(nome: string): string {
  const semAcento = nome.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const limpo = semAcento.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return limpo.slice(-120) || "arquivo";
}

const texto = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, MAX_TEXTO) : "");

export async function POST(request: Request) {
  let corpo: FormData;
  try {
    corpo = await request.formData();
  } catch {
    return erro("Não foi possível ler o envio.");
  }

  // 1. Lê e confere os campos
  let bruto: { form?: Record<string, unknown>; itens?: { id?: string; texto?: string }[] };
  try {
    bruto = JSON.parse(String(corpo.get("dados") || "{}"));
  } catch {
    return erro("Dados do envio em formato inválido.");
  }
  const f = bruto.form || {};
  const ganho = GANHOS.includes(f.ganho as Ganho) ? (f.ganho as Ganho) : "";
  const ganhosSec = Array.isArray(f.ganhosSec) ? (f.ganhosSec as unknown[]).filter((g): g is Ganho => GANHOS.includes(g as Ganho) && g !== ganho) : [];
  const justSecBruto = (f.justSec && typeof f.justSec === "object" ? f.justSec : {}) as Record<string, unknown>;
  const justSec: Partial<Record<Ganho, string>> = {};
  ganhosSec.forEach((g) => {
    const t = texto(justSecBruto[g]);
    if (t) justSec[g] = t;
  });

  const form: Formulario = {
    ...FORMULARIO_VAZIO,
    problema: texto(f.problema),
    volume: texto(f.volume),
    volNaoSei: f.volNaoSei === true,
    valorCaso: texto(f.valorCaso),
    ganho,
    ganhosSec,
    justPrinc: texto(f.justPrinc),
    justSec,
    dados: texto(f.dados),
    links: Array.isArray(f.links) ? (f.links as unknown[]).map(texto).filter(Boolean).slice(0, 30) : [],
    produto: texto(f.produto),
    interessados: texto(f.interessados),
    stakeholders: texto(f.stakeholders),
    nome: texto(f.nome),
    area: texto(f.area),
    email: texto(f.email),
    usouExemplo: f.usouExemplo === true,
  };

  const faltando = camposFaltando(form);
  if (faltando.length) return erro("Faltam campos obrigatórios: " + faltando.map((k) => ROTULOS[k][0]).join(", ") + ".");
  if (!form.volNaoSei && num(form.volume) <= 0) return erro("Informe quantas vezes acontece por mês com um número, ou marque \"Não sei agora\".");
  if (form.valorCaso && num(form.valorCaso) <= 0) return erro("O custo por caso precisa ser um número.");

  const itens = new Map<IdItem, string>();
  (bruto.itens || []).forEach((it) => {
    if (IDS.includes(it.id as IdItem)) itens.set(it.id as IdItem, texto(it.texto));
  });
  if (IDS.some((id) => !itens.get(id))) return erro("Confirme os quatro itens antes de enviar.");

  const arquivos = corpo.getAll("anexos").filter((a): a is File => a instanceof File && a.size > 0);
  if (arquivos.length > MAX_ARQUIVOS) return erro(`Envie no máximo ${MAX_ARQUIVOS} arquivos.`);
  for (const a of arquivos) {
    const ext = a.name.split(".").pop()?.toLowerCase() || "";
    if (!EXTENSOES.includes(ext)) return erro(`O arquivo "${a.name}" não é de um tipo aceito.`);
    if (a.size > MAX_BYTES) return erro(`O arquivo "${a.name}" passa de 10 MB.`);
  }

  // 2. Grava no banco; a função do banco gera o código PR-MMAA-NNNN
  let supabase;
  try {
    supabase = supabaseServidor();
  } catch (e) {
    if (e instanceof ConfiguracaoFaltando) return erro("O banco de dados ainda não está configurado.", 503);
    throw e;
  }

  const { data: codigo, error } = await supabase.rpc("criar_demanda", {
    d: {
      problema: form.problema,
      volume_mes: form.volNaoSei ? "" : String(num(form.volume)),
      volume_nao_sei: form.volNaoSei,
      valor_caso: form.valorCaso ? String(num(form.valorCaso)) : "",
      ganho_principal: form.ganho,
      justificativa_principal: form.justPrinc,
      ganhos_secundarios: form.ganhosSec,
      justificativas_secundarias: form.justSec,
      evidencias_texto: form.dados,
      links: form.links,
      produto: form.produto,
      time_recebedor: form.interessados,
      stakeholders: form.stakeholders,
      nome: form.nome,
      area: form.area,
      email: form.email,
      usou_exemplo: form.usouExemplo,
      resumo: itens.get("resumo"),
      nome_solucao: itens.get("nome"),
      hipotese: itens.get("hipotese"),
      riscos: itens.get("riscos"),
    },
  });
  if (error || typeof codigo !== "string") {
    console.error("Erro ao criar demanda:", error);
    return erro("Não foi possível salvar a demanda agora. Tente de novo em instantes.", 500);
  }

  // 3. Guarda os anexos em anexos/<código>/ e registra os caminhos na demanda
  const caminhos: string[] = [];
  const falharam: string[] = [];
  for (const [i, a] of arquivos.entries()) {
    const caminho = `${codigo}/${i + 1}-${nomeSeguro(a.name)}`;
    const { error: e } = await supabase.storage.from(PASTA_ANEXOS).upload(caminho, a, { contentType: a.type || undefined, upsert: false });
    if (e) {
      console.error("Erro ao subir anexo:", a.name, e);
      falharam.push(a.name);
    } else caminhos.push(caminho);
  }
  if (caminhos.length) {
    const { error: e } = await supabase.from("demandas").update({ anexos: caminhos }).eq("codigo", codigo);
    if (e) console.error("Erro ao registrar anexos:", e);
  }

  return Response.json({ codigo, anexosComFalha: falharam }, { status: 201 });
}

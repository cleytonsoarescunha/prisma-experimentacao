// Recebe uma demanda nova: grava no banco (que gera o código), guarda o PDF do canvas e envia o e-mail.
// Os anexos não passam por aqui (a hospedagem limita o tamanho de cada envio): o servidor devolve uma
// autorização de uso único por arquivo, e o navegador manda cada um direto para o Storage.
// Depois, o navegador confirma em /api/demandas/[codigo]/anexos quais chegaram.

import { assinar } from "@/lib/assinatura";
import { enviarEmailCanvas } from "@/lib/email";
import { nomeValido, num } from "@/lib/regras";
import { ConfiguracaoFaltando, PASTA_ANEXOS, supabaseServidor } from "@/lib/supabase-servidor";
import { FORMULARIO_VAZIO, GANHOS, type Formulario, type Ganho, type IdItem } from "@/lib/tipos";
import { MENSAGENS_NUMERO, ROTULOS, camposFaltando, numerosInvalidos, temCustoPorCaso } from "@/lib/validacao";

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
    valorCaso: f.valorNaoSei === true ? "" : texto(f.valorCaso),
    valorNaoSei: f.valorNaoSei === true,
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
  const invalidos = numerosInvalidos(form);
  if (invalidos.length) return erro(MENSAGENS_NUMERO[invalidos[0]][0]);

  const itens = new Map<IdItem, string>();
  (bruto.itens || []).forEach((it) => {
    if (IDS.includes(it.id as IdItem)) itens.set(it.id as IdItem, texto(it.texto));
  });
  if (IDS.some((id) => !itens.get(id))) return erro("Confirme os quatro itens antes de enviar.");
  if (!nomeValido(itens.get("nome") || "")) return erro("Dê um nome para a solução antes de enviar.");

  // Anexos: só a lista (nome, tamanho). Os arquivos vão direto do navegador para o Storage depois.
  const resultadoAnexos = lerListaAnexos(corpo.get("anexos"));
  if (typeof resultadoAnexos === "string") return erro(resultadoAnexos);
  const pdf = await lerPdf(corpo.get("pdf"));

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
      valor_caso: temCustoPorCaso(form) ? String(num(form.valorCaso)) : "",
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

  // 3. Guarda o PDF do canvas (gerado no navegador) junto dos anexos
  let pdfGuardado = false;
  if (pdf) {
    const caminho = `${codigo}/${codigo}.pdf`;
    const { error: e } = await supabase.storage.from(PASTA_ANEXOS).upload(caminho, pdf, { contentType: "application/pdf", upsert: true });
    if (e) console.error("[pdf] erro ao guardar:", e.message);
    else {
      pdfGuardado = true;
      const { error: e2 } = await supabase.from("demandas").update({ pdf_canvas: caminho }).eq("codigo", codigo);
      if (e2) console.error("[pdf] erro ao registrar:", e2.message);
    }
  }

  // 4. Autorizações de uso único para o navegador mandar cada anexo direto para o Storage
  const envios: { nome: string; caminho: string; url: string }[] = [];
  for (const [i, a] of resultadoAnexos.entries()) {
    const caminho = `${codigo}/${i + 1}-${nomeSeguro(a.nome)}`;
    const { data, error: e } = await supabase.storage.from(PASTA_ANEXOS).createSignedUploadUrl(caminho);
    if (e || !data) console.error("[anexos] erro ao autorizar:", a.nome, e?.message);
    else envios.push({ nome: a.nome, caminho, url: data.signedUrl });
  }

  // 5. E-mail para quem enviou, com o PDF. Se falhar, a demanda já está salva.
  const emailEnviado = await enviarEmailCanvas({
    para: form.email,
    nome: form.nome,
    codigo,
    nomeSolucao: itens.get("nome") || "",
    pdf,
  });

  return Response.json(
    {
      codigo,
      envios,
      anexosSemAutorizacao: resultadoAnexos.filter((a) => !envios.some((e) => e.nome === a.nome)).map((a) => a.nome),
      assinatura: assinar(codigo),
      pdfGuardado,
      emailEnviado,
    },
    { status: 201 },
  );
}

/** Lê a lista de anexos (nome e tamanho) e confere quantidade, tipo e tamanho. Devolve a lista ou a mensagem de erro. */
function lerListaAnexos(bruto: FormDataEntryValue | null): { nome: string; tamanho: number }[] | string {
  let lista: unknown;
  try {
    lista = JSON.parse(typeof bruto === "string" ? bruto : "[]");
  } catch {
    return "Lista de anexos em formato inválido.";
  }
  if (!Array.isArray(lista)) return "Lista de anexos em formato inválido.";
  const anexos = lista
    .map((a) => ({ nome: typeof a?.nome === "string" ? a.nome.slice(0, 200) : "", tamanho: Number(a?.tamanho) || 0 }))
    .filter((a) => a.nome && a.tamanho > 0);
  if (anexos.length > MAX_ARQUIVOS) return `Envie no máximo ${MAX_ARQUIVOS} arquivos.`;
  for (const a of anexos) {
    const ext = a.nome.split(".").pop()?.toLowerCase() || "";
    if (!EXTENSOES.includes(ext)) return `O arquivo "${a.nome}" não é de um tipo aceito.`;
    if (a.tamanho > MAX_BYTES) return `O arquivo "${a.nome}" passa de 10 MB.`;
  }
  return anexos;
}

/** Lê o PDF do canvas gerado no navegador. Aceita só PDF de até 5 MB; fora disso, segue sem PDF. */
async function lerPdf(bruto: FormDataEntryValue | null): Promise<Buffer | null> {
  if (!(bruto instanceof File) || bruto.size === 0 || bruto.size > 5 * 1024 * 1024) return null;
  const conteudo = Buffer.from(await bruto.arrayBuffer());
  return conteudo.subarray(0, 5).toString() === "%PDF-" ? conteudo : null;
}
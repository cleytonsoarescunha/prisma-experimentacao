// Lê uma demanda do banco e devolve no mesmo formato que as telas usam (formulário + itens conferidos).

import "server-only";
import { supabaseServidor } from "./supabase-servidor";
import { TITULOS } from "./regras";
import { FORMULARIO_VAZIO, GANHOS, type Formulario, type Ganho, type IdItem, type ItemOrganizado } from "./tipos";

export interface DemandaDoBanco {
  codigo: string;
  form: Formulario;
  itens: ItemOrganizado[];
  pdfCanvas: string | null;
}

const ehGanho = (g: unknown): g is Ganho => GANHOS.includes(g as Ganho);
const numeroTexto = (v: unknown) => (v === null || v === undefined ? "" : String(v).replace(".", ","));

export async function buscarDemanda(codigo: string): Promise<DemandaDoBanco | null> {
  const { data, error } = await supabaseServidor().from("demandas").select("*").eq("codigo", codigo).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const justSecBruto = (data.justificativas_secundarias || {}) as Record<string, unknown>;
  const ganhosSec = ((data.ganhos_secundarios || []) as unknown[]).filter(ehGanho);
  const justSec: Partial<Record<Ganho, string>> = {};
  ganhosSec.forEach((g) => {
    if (typeof justSecBruto[g] === "string") justSec[g] = justSecBruto[g] as string;
  });

  const form: Formulario = {
    ...FORMULARIO_VAZIO,
    problema: data.problema || "",
    volume: numeroTexto(data.volume_mes),
    volNaoSei: !!data.volume_nao_sei,
    valorCaso: numeroTexto(data.valor_caso),
    valorNaoSei: data.valor_caso === null,
    ganho: ehGanho(data.ganho_principal) ? data.ganho_principal : "",
    ganhosSec,
    justPrinc: data.justificativa_principal || "",
    justSec,
    dados: data.evidencias_texto || "",
    links: data.links || [],
    produto: data.produto || "",
    interessados: data.time_recebedor || "",
    stakeholders: data.stakeholders || "",
    nome: data.nome || "",
    area: data.area || "",
    email: data.email || "",
    usouExemplo: !!data.usou_exemplo,
  };

  const textos: Record<IdItem, string> = {
    resumo: data.resumo || "",
    nome: data.nome_solucao || "",
    hipotese: data.hipotese || "",
    riscos: data.riscos || "",
  };
  const itens = (Object.keys(textos) as IdItem[]).map((id) => ({ id, titulo: TITULOS[id], texto: textos[id], aceito: true, editando: false }));

  return { codigo: data.codigo, form, itens, pdfCanvas: data.pdf_canvas || null };
}

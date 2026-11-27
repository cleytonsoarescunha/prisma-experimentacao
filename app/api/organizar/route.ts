// Passo 2: organiza o relato (resumo, nome, hipótese e riscos) com a IA, ou com as regras se a IA falhar.
// Recebe só os campos do relato; nome, área, e-mail e stakeholders não são lidos aqui.

import { organizarRelato } from "@/lib/ia";
import { FORMULARIO_VAZIO, GANHOS, type Formulario, type Ganho } from "@/lib/tipos";

const MAX_TEXTO = 8000;
const texto = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, MAX_TEXTO) : "");

export async function POST(request: Request) {
  let f: Record<string, unknown>;
  try {
    const corpo = await request.json();
    f = corpo && typeof corpo.form === "object" && corpo.form ? corpo.form : {};
  } catch {
    return Response.json({ erro: "Dados em formato inválido." }, { status: 400 });
  }

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
    produto: texto(f.produto),
    interessados: texto(f.interessados),
    usouExemplo: f.usouExemplo === true,
  };
  if (!form.problema) return Response.json({ erro: "Conte o problema antes de continuar." }, { status: 400 });

  const { itens, origem } = await organizarRelato(form);
  return Response.json({ itens, origem });
}

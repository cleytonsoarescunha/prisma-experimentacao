// Regras de campos obrigatórios do Passo 1. Usadas na tela e de novo no servidor.

import { num } from "./regras";
import type { Formulario } from "./tipos";

export type CampoObrigatorio =
  | "problema"
  | "volume"
  | "valorCaso"
  | "ganho"
  | "justPrinc"
  | "produto"
  | "interessados"
  | "nome"
  | "area"
  | "email";

/** Nome mostrado no aviso e id do elemento para onde a tela vai (na ordem da tela). */
export const ROTULOS: Record<CampoObrigatorio, [string, string]> = {
  problema: ["Conte o problema", "f-problema"],
  volume: ["Quantas vezes acontece por mês", "f-volume"],
  valorCaso: ["Quanto custa cada caso", "f-valor"],
  ganho: ["Tipo de ganho principal", "g-ganho"],
  justPrinc: ["Por que esse ganho", "f-just"],
  produto: ["Produto ou jornada", "f-produto"],
  interessados: ["Time que vai receber a solução", "f-interessados"],
  nome: ["Seu nome", "f-nome"],
  area: ["Sua área", "f-area"],
  email: ["Seu e-mail", "f-email"],
};

/**
 * Lista, na ordem da tela, os campos que ainda estão vazios.
 * Os dois números do tamanho do problema seguem o mesmo padrão: um número ou a caixa "Não sei agora".
 */
export function camposFaltando(s: Formulario): CampoObrigatorio[] {
  return (Object.keys(ROTULOS) as CampoObrigatorio[]).filter((k) => {
    if (k === "volume" && s.volNaoSei) return false;
    if (k === "valorCaso" && s.valorNaoSei) return false;
    if (k === "justPrinc" && !s.ganho) return false;
    return !String(s[k] || "").trim();
  });
}

export type CampoNumerico = "volume" | "valorCaso";

/** Mensagem e id do elemento de cada campo numérico com problema. */
export const MENSAGENS_NUMERO: Record<CampoNumerico, [string, string]> = {
  volume: ['Em "Quantas vezes acontece por mês", escreva um número (por exemplo, 3000) ou marque "Não sei agora".', "f-volume"],
  valorCaso: ['Em "Quanto custa cada caso", escreva um número (por exemplo, 25 ou 12,50) ou marque "Não sei agora".', "f-valor"],
};

/** Campos preenchidos que não têm um número válido (maior que zero). Campos vazios ficam com camposFaltando. */
export function numerosInvalidos(s: Formulario): CampoNumerico[] {
  const invalidos: CampoNumerico[] = [];
  if (!s.volNaoSei && s.volume.trim() && num(s.volume) <= 0) invalidos.push("volume");
  if (!s.valorNaoSei && s.valorCaso.trim() && num(s.valorCaso) <= 0) invalidos.push("valorCaso");
  return invalidos;
}

/** O custo por caso só conta quando a pessoa informou um número maior que zero. */
export function temCustoPorCaso(s: Formulario): boolean {
  return !s.valorNaoSei && num(s.valorCaso) > 0;
}

// Regras de campos obrigatórios do Passo 1. Usadas na tela e de novo no servidor.

import type { Formulario } from "./tipos";

export type CampoObrigatorio = "problema" | "volume" | "ganho" | "justPrinc" | "produto" | "interessados" | "nome" | "area" | "email";

/** Nome mostrado no aviso e id do elemento para onde a tela vai. */
export const ROTULOS: Record<CampoObrigatorio, [string, string]> = {
  problema: ["Conte o problema", "f-problema"],
  volume: ["Quantas vezes acontece por mês", "f-volume"],
  ganho: ["Tipo de ganho principal", "g-ganho"],
  justPrinc: ["Por que esse ganho", "f-just"],
  produto: ["Produto ou jornada", "f-produto"],
  interessados: ["Time que vai receber a solução", "f-interessados"],
  nome: ["Seu nome", "f-nome"],
  area: ["Sua área", "f-area"],
  email: ["Seu e-mail", "f-email"],
};

/** Lista, na ordem da tela, os campos obrigatórios que ainda estão vazios. */
export function camposFaltando(s: Formulario): CampoObrigatorio[] {
  return (Object.keys(ROTULOS) as CampoObrigatorio[]).filter((k) => {
    if (k === "volume" && s.volNaoSei) return false;
    if (k === "justPrinc" && !s.ganho) return false;
    return !String(s[k] || "").trim();
  });
}

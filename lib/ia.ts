// Ponto único de toda chamada de IA do Prisma.
// Quem usa só conhece a função organizarRelato; o fornecedor (Gemini, Claude...) fica escondido aqui.
// Fatia 1: ainda sem IA, usa apenas as regras do protótipo. Na Fatia 3 entra o Gemini, com estas regras como plano B.

import { organizarSemIA } from "./regras";
import type { Formulario, ItemOrganizado } from "./tipos";

export async function organizarRelato(form: Formulario): Promise<ItemOrganizado[]> {
  return organizarSemIA(form);
}

export const GANHOS = [
  "Redução de custo",
  "Aumento de receita",
  "Experiência do cliente",
  "Inovação",
] as const;

export type Ganho = (typeof GANHOS)[number];

export const DICAS_GANHO: Record<Ganho, string> = {
  "Redução de custo":
    "Que custo diminui? Ex.: horas do backoffice, retrabalho, chamados repetidos.",
  "Aumento de receita":
    "De onde vem a receita? Ex.: vendas que hoje se perdem, clientes que desistem.",
  "Experiência do cliente":
    "O que melhora para o cliente? Ex.: menos espera, menos contatos, jornada mais simples.",
  Inovação:
    "O que há de novo? Ex.: uma forma de atender que ainda não existe na empresa.",
};

/** Tudo o que a pessoa preenche no Passo 1. */
export interface Formulario {
  problema: string;
  volume: string;
  volNaoSei: boolean;
  valorCaso: string;
  /** Marcado quando a pessoa ainda não sabe quanto custa cada caso. */
  valorNaoSei: boolean;
  ganho: Ganho | "";
  ganhosSec: Ganho[];
  justPrinc: string;
  justSec: Partial<Record<Ganho, string>>;
  dados: string;
  arquivos: File[];
  links: string[];
  produto: string;
  interessados: string;
  stakeholders: string;
  nome: string;
  area: string;
  email: string;
  /** Marcado quando a pessoa usou "Preencher com exemplo". */
  usouExemplo: boolean;
}

export const FORMULARIO_VAZIO: Formulario = {
  problema: "",
  volume: "",
  volNaoSei: false,
  valorCaso: "",
  valorNaoSei: false,
  ganho: "",
  ganhosSec: [],
  justPrinc: "",
  justSec: {},
  dados: "",
  arquivos: [],
  links: [],
  produto: "",
  interessados: "",
  stakeholders: "",
  nome: "",
  area: "",
  email: "",
  usouExemplo: false,
};

export type IdItem = "resumo" | "nome" | "hipotese" | "riscos";

/** Um dos quatro itens que a pessoa confere no Passo 3. */
export interface ItemOrganizado {
  id: IdItem;
  titulo: string;
  texto: string;
  aceito: boolean;
  editando: boolean;
}

export interface Demanda {
  codigo: string;
  enviadoEm: Date;
  form: Formulario;
  itens: ItemOrganizado[];
  /** Índice da etapa atual na esteira (0 = Mapeamento de problemas). */
  etapa: number;
  /** Nomes dos anexos que não conseguiram ser guardados. */
  anexosComFalha?: string[];
  /** Assinatura que libera o download do PDF desta demanda. */
  assinaturaPdf?: string;
  /** Se o e-mail com o canvas foi aceito pelo serviço de e-mail. */
  emailEnviado?: boolean;
}

export const ETAPAS_ESTEIRA = [
  "Mapeamento de problemas",
  "Desenho de solução",
  "Prototipação",
  "Testes",
  "Decisão de pilotar",
  "Priorização",
  "Piloto",
  "Transferência de conhecimento",
] as const;

/**
 * Passos do pedido: detalham as etapas 1 e 2 da esteira.
 * Etapa 1 (Mapeamento de problemas): passos 1 e 2. Etapa 2 (Desenho de solução): passos 3 a 5.
 */
export const PASSOS_PEDIDO = [
  { t: "Demanda recebida", d: "Você conta o problema aqui no Prisma, confere o resumo e recebe o código da demanda.", etapa: 0 },
  { t: "Reunião inicial agendada", d: "Uma conversa com o time InovAI para validar as informações e aprofundar o discovery.", etapa: 0 },
  { t: "Priorização de estudos", d: "O time InovAI prioriza quais problemas serão estudados primeiro.", etapa: 1 },
  { t: "Validação e métricas da PoC", d: "Validamos a proposta com os interessados e definimos as métricas da PoC.", etapa: 1 },
  { t: "Em desenvolvimento", d: "O time desenvolve a solução. Depois, ela segue para a Prototipação.", etapa: 1 },
] as const;

/** Descrição curta de onde a demanda está: "Etapa 1 · Demanda recebida" ou "Etapa 4 · Testes". */
export function descreverSituacao(situacao: string): string {
  const { esteira, passo } = posicaoDemanda(situacao);
  return passo < PASSOS_PEDIDO.length ? `Etapa ${esteira + 1} · ${PASSOS_PEDIDO[passo].t}` : `Etapa ${esteira + 1} · ${ETAPAS_ESTEIRA[esteira]}`;
}

/** Todas as situações possíveis de uma demanda, em ordem: os 5 passos do pedido e as etapas 3 a 8 da esteira. */
export const SITUACOES_DEMANDA: string[] = [...PASSOS_PEDIDO.map((p) => p.t), ...ETAPAS_ESTEIRA.slice(2)];

/**
 * Converte a situação gravada no banco em etapa da esteira (0 a 7) e passo do pedido.
 * passo vai de 0 a 4 nas etapas 1 e 2; é 5 quando os passos já terminaram (etapa 3 em diante).
 */
export function posicaoDemanda(situacao: string): { esteira: number; passo: number } {
  const passo = PASSOS_PEDIDO.findIndex((p) => p.t === situacao);
  if (passo >= 0) return { esteira: PASSOS_PEDIDO[passo].etapa, passo };
  const esteira = ETAPAS_ESTEIRA.indexOf(situacao as (typeof ETAPAS_ESTEIRA)[number]);
  if (esteira >= 2) return { esteira, passo: PASSOS_PEDIDO.length };
  return { esteira: 0, passo: 0 };
}

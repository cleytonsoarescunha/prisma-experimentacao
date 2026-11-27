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
}

export const ETAPAS_ESTEIRA = [
  "Mapeamento de problemas",
  "Desenho de solução",
  "Prototipação",
  "Testes",
  "Decisão de pilotar",
  "Priorização",
  "Piloto",
  "Crescimento",
] as const;

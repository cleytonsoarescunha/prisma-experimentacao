// Regras sem IA, copiadas do protótipo aprovado (função montarIA e cálculo do canvas).
// Servem hoje para o Passo 3 e, na Fatia 3, como plano B quando a IA falhar.

import type { Formulario, Ganho, IdItem, ItemOrganizado } from "./tipos";

export const PF = "[a ser preenchido]";

export const TITULOS: Record<IdItem, string> = {
  resumo: "Resumo do problema",
  nome: "Nome da solução",
  hipotese: "Hipótese",
  riscos: "Riscos iniciais",
};

/** Lê números escritos do jeito brasileiro: "3.000", "25", "1.500,50". */
export function num(v: string): number {
  const t = String(v || "")
    .replace(/[^0-9,.]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(t);
  return isFinite(n) ? n : 0;
}

export function inteiro(n: number): string {
  return Math.round(n).toLocaleString("pt-BR");
}

export function brl(n: number): string {
  if (n >= 1e6) return "R$ " + (n / 1e6).toFixed(1).replace(".", ",") + " mi";
  if (n >= 1e3) return "R$ " + Math.round(n / 1e3) + " mil";
  return "R$ " + Math.round(n);
}

export function preco(n: number): string {
  return n < 1000 ? "R$ " + n.toFixed(2).replace(".", ",") : brl(n);
}

function minus(t: string): string {
  return String(t || "").replace(/^./, (c) => c.toLowerCase());
}

/** Primeira frase do relato, com até cerca de 110 caracteres e sem reticências. */
export function resumoFrase(problema: string): string {
  let frase = String(problema || "").split(/[.!?\n]/)[0].trim();
  if (frase.length > 110) {
    let corte = -1;
    [",", " porque ", " quando ", " e "].forEach((sep) => {
      const ix = frase.lastIndexOf(sep, 110);
      if (ix > 40 && corte < 0) corte = ix;
    });
    frase =
      corte > 0
        ? frase.slice(0, corte).trim()
        : frase.slice(0, frase.lastIndexOf(" ", 110)).trim();
  }
  return frase;
}

function item(id: IdItem, texto: string): ItemOrganizado {
  return { id, titulo: TITULOS[id], texto, aceito: false, editando: false };
}

const TEMAS: { k: string[]; n: string; a: string; r: string }[] = [
  { k: ["endereço", "endereco", "cep", "hp "], n: "Match HP", a: "validar e sugerir o endereço correto automaticamente", r: "o dado é corrigido antes de o pedido seguir" },
  { k: ["documento", "rg", "cnh", "comprovante"], n: "Validador de Documentos", a: "conferir os documentos do cliente automaticamente", r: "a conferência deixa de depender de uma pessoa" },
  { k: ["agend", "horário", "horario", "visita", "instalação", "instalacao"], n: "Agente de Agendamento", a: "sugerir horários disponíveis de forma automática", r: "o cliente encontra um horário sem precisar de outro canal" },
  { k: ["dúvida", "duvida", "pergunta", "faq", "atendimento"], n: "Agente de Suporte", a: "responder as dúvidas do cliente com um agente digital", r: "o cliente tem a resposta na hora, no canal em que já está" },
  { k: ["fatura", "cobrança", "cobranca", "pagamento", "boleto"], n: "Fatura Clara", a: "explicar a fatura ao cliente de forma simples e automática", r: "o cliente entende a cobrança sem precisar ligar" },
  { k: ["plano", "oferta", "escolher", "escolha"], n: "Buscador de Produtos", a: "recomendar o plano certo para o perfil do cliente", r: "a escolha passa a considerar o uso real do cliente" },
  { k: ["cadastro", "formulário", "formulario", "preench"], n: "Cadastro Sem Erro", a: "validar os dados do cadastro no momento do preenchimento", r: "o erro é corrigido na origem" },
  { k: ["fila", "manual", "backoffice", "bko", "retrabalho"], n: "Fila Zero", a: "automatizar a tratativa que hoje é feita à mão", r: "o caso é resolvido sem passar pela fila" },
];

/** Nome usado pelas regras sem IA quando o relato não cai em nenhum tema conhecido. */
const NOME_POR_GANHO: Record<Ganho, string> = {
  "Redução de custo": "Processo Enxuto",
  "Aumento de receita": "Venda Garantida",
  "Experiência do cliente": "Jornada Simples",
  Inovação: "Nova Rota",
};

/** Confere se o nome da solução é válido (não vazio e não um espaço reservado como "[a ser preenchido]"). */
export function nomeValido(nome: string): boolean {
  const t = nome.trim();
  return t.length > 0 && !t.startsWith("[");
}

/** Gera resumo, nome, hipótese e riscos por palavras-chave (sem IA). */
export function organizarSemIA(s: Formulario): ItemOrganizado[] {
  if (s.usouExemplo) {
    return [
      item("resumo", "Pedidos de banda larga no e-commerce travam porque o endereço não é encontrado na base"),
      item("nome", "Match HP"),
      item("hipotese", "Acredito que validar e sugerir o endereço correto ainda no checkout, porque o cliente corrige o dado antes de concluir a compra, o que resultará em menos pedidos no tratamento manual do backoffice, entre os cerca de 3.000 casos por mês."),
      item("riscos", "Técnico: a base de endereços pode estar desatualizada e limitar as sugestões.\nNegócio: o ganho depende de quantos pedidos realmente travam por endereço.\nOperacional: o backoffice precisa ajustar o fluxo de tratamento.\nAdoção: o cliente pode ignorar a sugestão no checkout."),
    ];
  }

  const produto = String(s.produto || "").trim();
  const txt = String(s.problema || "").toLowerCase();
  const tem = (lista: string[]) => lista.some((w) => txt.indexOf(w) >= 0);

  // 1. Nome: tema que já tem solução no portfólio usa o nome oficial; sem tema, um nome pelo ganho esperado.
  // O nome nunca fica em aberto: a pessoa confere e pode trocar no Passo 3.
  const tema = TEMAS.find((t) => tem(t.k));
  const nome = tema ? tema.n : s.ganho ? NOME_POR_GANHO[s.ganho] : "Solução em Foco";

  // 2. Hipótese: Acredito que [ação], porque [razão], o que resultará em [resultado mensurável].
  const vol = parseFloat(String(s.volume || "").replace(/[^0-9]/g, "")) || 0;
  const volTxt =
    vol > 0 && !s.volNaoSei
      ? ", entre os cerca de " + Math.round(vol).toLocaleString("pt-BR") + " casos por mês"
      : "";
  const acao = tema
    ? tema.a
    : "criar uma solução para esse problema" + (produto ? " em " + minus(produto) : "");
  const razao = tema ? tema.r : "isso ataca a causa do problema relatado";
  const resultados: Record<Ganho, string> = {
    "Redução de custo": "menos casos em tratamento manual e menor custo por caso" + volTxt,
    "Aumento de receita": "mais vendas concluídas" + volTxt,
    "Experiência do cliente": "menos esforço do cliente, com menos contatos e etapas" + volTxt,
    Inovação: "uma nova forma de resolver o caso, adotada por quem usa",
  };
  const resultado = s.ganho ? resultados[s.ganho] : "menos ocorrências do problema" + volTxt;
  const hip = "Acredito que " + acao + ", porque " + razao + ", o que resultará em " + resultado + ".";

  // 3. Riscos: comuns + do ganho + dos dados que faltam.
  const riscos = ["Técnico: os dados necessários podem não estar disponíveis ou completos."];
  if (s.volNaoSei || !vol)
    riscos.push("Negócio: o tamanho do problema ainda não foi medido; o volume precisa ser levantado antes do teste.");
  else riscos.push("Negócio: o volume informado pode não se confirmar nos dados reais.");
  if (s.ganho === "Aumento de receita")
    riscos.push("Negócio: parte das vendas recuperadas pode não se converter.");
  if (s.ganho === "Experiência do cliente")
    riscos.push("Adoção: o cliente pode não perceber a mudança se ela ficar escondida na jornada.");
  const time = String(s.interessados || "").trim();
  riscos.push("Adoção: " + (time ? "o " + minus(time) : "o time recebedor") + " precisa incorporar a solução na rotina.");

  // 4. Resumo: primeira frase, vira o subtítulo do canvas.
  const frase = resumoFrase(s.problema);

  return [
    item("resumo", frase || PF),
    item("nome", nome),
    item("hipotese", hip),
    item("riscos", riscos.join("\n")),
  ];
}

/** Separa nomes digitados com vírgula, ponto e vírgula, quebra de linha ou " e ". */
function lista(t: string): string[] {
  return String(t || "")
    .split(/[,;\n]| e /)
    .map((x) => x.trim())
    .filter(Boolean);
}

function ordena(a: string[]): string[] {
  return a.slice().sort((x, y) => x.localeCompare(y, "pt-BR"));
}

export interface DadosCanvas {
  titulo: string;
  subtitulo: string;
  classes: { t: string; principal: boolean }[];
  produto: string;
  temHero: boolean;
  heroNum: string;
  heroUni: string;
  heroLinha: string;
  heroNota: string;
  equipes: string;
  stakeholders: string;
  problema: string;
  proposta: string;
  beneficios: string[];
  hipotese: string;
  linhas: { a: string; b: string }[];
  cPess: string;
  cReal: string;
  cOtim: string;
  premissa: string;
  riscos: string[];
}

/** Monta tudo o que aparece no canvas a partir do formulário e dos itens conferidos. */
export function montarCanvas(s: Formulario, itens: ItemOrganizado[]): DadosCanvas {
  const campo = (id: IdItem) => itens.find((x) => x.id === id)?.texto.trim() || "";
  const vol = s.volNaoSei ? 0 : num(s.volume);
  const val = s.valorNaoSei ? 0 : num(s.valorCaso);

  const classes = s.ganho ? [s.ganho, ...s.ganhosSec] : [];
  const equipes = lista(s.interessados);
  if (equipes.length && equipes.indexOf("InovAI") < 0) equipes.push("InovAI");
  const stk = ordena(lista(s.stakeholders));

  const temHero = vol > 0 && val > 0;
  const real = vol * 0.5 * val * 12;
  const partes = (n: number) => {
    if (n >= 1e6) return { num: (n / 1e6).toFixed(1).replace(".", ","), uni: "mi" };
    if (n >= 1e3)
      return {
        num: (n / 1e3 >= 100 ? Math.round(n / 1e3) : (n / 1e3).toFixed(1).replace(".", ",")).toString(),
        uni: "mil",
      };
    return { num: String(Math.round(n)), uni: "" };
  };
  const hp = partes(real);
  const linhaGanho =
    s.ganho === "Redução de custo"
      ? "de economia por ano"
      : s.ganho === "Aumento de receita"
        ? "de receita por ano"
        : "de impacto por ano";

  const linhas =
    vol > 0
      ? [
          { a: inteiro(vol), b: "casos/mês" },
          { a: "× 50%", b: "resolvidos = " + inteiro(vol * 0.5) + " casos/mês" },
          ...(val > 0
            ? [
                { a: "× " + preco(val), b: "por caso = " + brl(vol * 0.5 * val) + "/mês" },
                { a: "× 12", b: "= " + brl(real) + "/ano" },
              ]
            : [{ a: "× " + PF, b: "valor por caso" }]),
        ]
      : [{ a: PF, b: "" }];
  const cen = (p: number) => (temHero ? brl(vol * p * val * 12) : PF);

  const beneficios: string[] = [];
  if (s.ganho && s.justPrinc.trim()) beneficios.push(s.justPrinc.trim());
  s.ganhosSec.forEach((g) => {
    const t = s.justSec[g];
    if (t && t.trim()) beneficios.push(t.trim());
  });

  const rk = campo("riscos")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  return {
    titulo: campo("nome") || PF,
    subtitulo: campo("resumo") || resumoFrase(s.problema) || PF,
    classes: classes.length
      ? classes.map((t, ix) => ({ t, principal: ix === 0 }))
      : [{ t: PF, principal: false }],
    produto: s.produto.trim() || PF,
    temHero,
    heroNum: hp.num,
    heroUni: hp.uni,
    heroLinha: linhaGanho,
    heroNota: temHero ? "50% de resolução: " + inteiro(vol * 0.5) + " casos/mês a " + preco(val) + "." : "",
    equipes: equipes.length ? ordena(equipes).join(", ") : PF,
    stakeholders: stk.length ? stk.join("\n") : PF,
    problema: s.problema.trim() || PF,
    proposta: PF,
    beneficios,
    hipotese: campo("hipotese") || PF,
    linhas,
    cPess: cen(0.3),
    cReal: cen(0.5),
    cOtim: cen(0.7),
    premissa: "Valores por ano. % de casos resolvidos pela solução.",
    riscos: rk.length ? rk : [PF],
  };
}

export const EXEMPLO: Partial<Formulario> = {
  usouExemplo: true,
  stakeholders: "[preencher: nomes]",
  nome: "[seu nome]",
  area: "[sua área]",
  email: "[seu.email@empresa.com.br]",
  problema:
    "No e-commerce, parte dos pedidos de banda larga trava porque o endereço do cliente não é encontrado na base, e o pedido vai para tratamento manual. Percebi pelo volume da fila do backoffice. O cliente conclui a compra, mas dias depois recebe contato pedindo para confirmar o endereço, e parte desiste da instalação.",
  dados: "Exemplo ilustrativo: números aproximados para demonstrar o cálculo.",
  volume: "3000",
  volNaoSei: false,
  valorCaso: "25",
  valorNaoSei: false,
  ganho: "Redução de custo",
  ganhosSec: ["Experiência do cliente"],
  justPrinc: "Menos pedidos caem no tratamento manual do backoffice, que hoje confere cada endereço à mão.",
  justSec: { "Experiência do cliente": "O cliente não é chamado dias depois para confirmar o endereço." },
  produto: "Banda larga no e-commerce",
  interessados: "Time de e-commerce",
};

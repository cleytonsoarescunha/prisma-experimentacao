# Prisma de Experimentação

Instruções do projeto para o Claude Code. Leia este arquivo inteiro antes de qualquer tarefa.

## O que é

O Prisma de Experimentação é uma aplicação web onde qualquer pessoa conta um problema de negócio com as próprias palavras e recebe, em poucos minutos, um canvas de iniciativa pré-preenchido. O time InovAI (time de experimentação, CoE Digital) usa esse canvas como ponto de partida de uma reunião de aprofundamento e leva o problema pela esteira de experimentação.

O Prisma não resolve o problema. Ele organiza o relato, estima o tamanho do problema e prepara a conversa.

- Dono do produto: Cleyton Cunha (PO, não é desenvolvedor). Fale com ele em português, de forma simples, sem jargão técnico desnecessário.
- Projeto pessoal, no GitHub dele. Sem marca de empresa: nada de logo, supergráfico ou nome de empresa na interface.
- Referência visual e de comportamento: `referencia/prototipo-Main.dc.html` (protótipo navegável aprovado). Ele usa um framework próprio de protótipo; use-o para copiar textos, regras e layout, não o código.

## Como trabalhar neste projeto

1. Construa em fatias (veja `PLANO.md`). Só comece uma fatia quando a anterior estiver funcionando e o Cleyton tiver testado.
2. Antes de escrever código de uma fatia, explique em poucas linhas o que vai fazer e o que ele vai poder testar no fim.
3. Mude só o que foi pedido. Se uma mudança obrigar a mexer em outra coisa (visual, texto, regra), avise e peça o ok antes.
4. No fim de cada fatia: rode a aplicação, confira você mesmo, diga ao Cleyton exatamente como testar e, com o ok dele, faça commit e push para o GitHub com uma mensagem clara em português.
5. Nunca coloque chaves, senhas ou tokens no código nem no GitHub. Use `.env.local` (fora do Git) e um `.env.example` sem valores.
6. Use só dados fictícios em desenvolvimento. O plano gratuito do Gemini pode usar os dados enviados para treinar modelos: nunca mande dados reais de empresa ou de pessoas para ele.
7. Escrita: português do Brasil, linguagem objetiva, sem travessões (use dois-pontos, vírgula ou ponto).

## Ferramentas

- Next.js com TypeScript, rodando localmente (`npm run dev`).
- Supabase (plano gratuito): banco Postgres, Storage para anexos e Auth por link no e-mail.
- IA: Gemini, plano gratuito (chave do Google AI Studio). Toda chamada de IA passa por um único módulo (ex.: `lib/ia.ts`) com uma interface própria, para trocar de fornecedor (por exemplo, para o Claude) mudando só uma variável de ambiente. Se a IA falhar ou estourar o limite, use as regras de fallback descritas em "Organização pela IA" para o usuário nunca ficar travado.
- Publicação na internet fica para o fim; até lá, tudo roda no computador do Cleyton.

## Telas e fluxo

A aplicação funciona no computador e no celular (layout responsivo; no celular, uma coluna).

### Página inicial
- Faixa vermelha com o título "Qual problema você quer resolver?", texto de apoio e o botão "Contar meu problema".
- Desenho do prisma de vidro (marca do Prisma; copie o SVG do protótipo).
- Esteira de experimentação com 8 etapas: Mapeamento de problemas, Desenho de solução, Prototipação, Testes, Decisão de pilotar, Priorização, Piloto, Crescimento. Nota: "O Piloto só acontece depois dos testes, com os resultados em mãos."
- Consulta pelo código: "Já enviou um problema? Digite o código e veja onde ele está na esteira." No computador fica na área branca, ao lado; no celular, depois do desenho do prisma. Ao consultar, a esteira destaca a etapa atual da demanda.

### Passo 1: Você conta
Campos (OBRIGATÓRIO ou OPCIONAL indicado ao lado do rótulo):
- Conte o problema (obrigatório, texto longo). Ajuda: "Do seu jeito, como contaria a um colega. Não precisa saber a causa nem a solução." Lista de apoio: o que está dando errado; como você percebeu; quem sofre com isso; o que acontece por causa disso.
- Tamanho do problema:
  - Quantas vezes acontece por mês? (obrigatório, numérico) com a caixa "Não sei agora" logo abaixo do campo. Marcada, o campo fica desabilitado e deixa de ser obrigatório.
  - Quanto custa cada caso? R$ (opcional).
- Que tipo de ganho você espera? (obrigatório) Principal: escolha um entre Redução de custo, Aumento de receita, Experiência do cliente, Inovação. Secundários: opcionais, quantos quiser.
  - Por que [ganho principal]? (obrigatório quando há ganho principal) e Por que [cada secundário]? (opcional). Dicas por ganho:
    - Redução de custo: "Que custo diminui? Ex.: horas do backoffice, retrabalho, chamados repetidos."
    - Aumento de receita: "De onde vem a receita? Ex.: vendas que hoje se perdem, clientes que desistem."
    - Experiência do cliente: "O que melhora para o cliente? Ex.: menos espera, menos contatos, jornada mais simples."
    - Inovação: "O que há de novo? Ex.: uma forma de atender que ainda não existe na empresa."
- Outras evidências (opcional): anexar arquivos (Word, Excel, PDF, PowerPoint, imagens), adicionar links (Figma, painéis etc.) e um campo de dados ou observações.
- Produto ou jornada (obrigatório): onde o problema acontece.
- Time que vai receber a solução (obrigatório).
- Stakeholders (opcional).
- Quem está enviando: Seu nome, Sua área e Seu e-mail (três campos separados, obrigatórios).
- Botões: "Continuar" e "Preencher com exemplo".
- Validação: ao clicar em Continuar com campos faltando, mostre "Faltam campos obrigatórios: [lista]" e leve a tela até o primeiro campo que falta.

Não existe campo de "ideia de solução": a proposta é definida com o time InovAI.

### Passo 2: Organizamos
Tela de espera curta com 3 etapas ("Lendo o que você contou", "Organizando a hipótese", "Preparando o resumo para o time InovAI") enquanto a IA trabalha.

### Passo 3: Você confere
A pessoa vê "Você contou" (resumo, com botão Editar que volta ao Passo 1) e quatro itens, cada um com Confirmar ou Editar:
1. Resumo do problema. Dica: "Uma frase curta sobre o problema. Ela vira o subtítulo do canvas."
2. Nome da solução. Dica: "Criativo e claro: ao ler, já dá para entender o que a solução faz."
3. Hipótese. Dica: "Formato: Acredito que [ação], porque [razão], o que resultará em [resultado]."
4. Riscos iniciais (um por linha, com o tipo na frente: Técnico, Negócio, Operacional, Adoção).
Só envia quando os quatro estiverem confirmados ("Enviar para o time InovAI").

### Tela final
- "Recebemos o seu problema", com o CÓDIGO DA DEMANDA em destaque.
- Se o volume ficou como "Não sei agora" ou o custo por caso ficou vazio: aviso amarelo "Leve estes números para a reunião", listando o que falta.
- O canvas pré-preenchido (ver abaixo) e o botão "Baixar [código].pdf".
- Próximo passo: reunião de aprofundamento com o time InovAI.
- Botão "Contar outro problema".

## Organização pela IA

A IA recebe o relato e devolve, em JSON validado: resumo do problema, nome da solução, hipótese e riscos. Regras:

- Resumo: uma frase curta e completa, sem reticências, com até cerca de 110 caracteres.
- Nome: mistura criatividade com clareza; ao ler, fica nítido do que se trata (ex.: "Fatura Clara", "Fila Zero"). Quando o problema cair no tema de uma solução que já existe no portfólio, use o nome oficial dela, nunca invente outro: endereço ou CEP: "Match HP"; documentos: "Validador de Documentos"; agendamento ou instalação: "Agente de Agendamento"; dúvidas ou atendimento: "Agente de Suporte"; escolha de planos ou ofertas: "Buscador de Produtos". Sem tema claro: "[a ser preenchido]".
- Hipótese no formato clássico: "Acredito que [ação], porque [razão], o que resultará em [resultado mensurável]." Se houver volume, cite os casos por mês no resultado.
- Riscos: 3 a 4, um por linha, com o tipo na frente.
- Fallback sem IA: as regras do protótipo (função `montarIA` no arquivo de referência) geram esses quatro itens por palavras-chave. Use-as se a IA falhar.

## Código da demanda

Formato `PR-MMAA-NNNN`, com hífen em tudo (ex.: `PR-1126-0001`). MMAA é o mês e o ano do envio; NNNN é a sequência dentro do mês, gerada no banco de forma segura contra envios simultâneos. O mesmo código nomeia o PDF do canvas.

## Canvas de iniciativa

Um slide 16:9 (1920 x 1080), igual em todos os lugares (tela, PDF). Campos sem informação mostram `[a ser preenchido]`.

Barra lateral vermelha (#E2262B, 490px, sem imagem de fundo):
- Nome da solução (bold 54px, reduz se for longo); subtítulo com o resumo do problema (24px).
- Tags dos ganhos: principal preenchida (fundo branco, texto vermelho), secundários só com contorno branco.
- PRODUTO BENEFICIADO (rótulo amarelo #FFC000) e o produto em bold 40px.
- CENÁRIO REALISTA: "R$" + número grande + "mil/mi" e uma linha com o que representa ("de economia por ano", "de receita por ano"). Sem volume ou sem custo por caso: `[a ser preenchido]`.
- No pé: Custo estimado (`[a ser preenchido]`), Equipes (time recebedor + InovAI, em ordem alfabética) e Stakeholders (um por linha, em ordem alfabética).

Área branca:
- Problema (o relato completo) e Proposta (`[a ser preenchido]`), um embaixo do outro.
- Abaixo, lado a lado: Benefícios (tópicos curtos, com as justificativas de ganho) e Hipótese.
- À direita, painel rosa "DA BASE AO IMPACTO": a conta linha a linha (casos/mês × 50% resolvidos × valor por caso × 12 = R$/ano) e três cenários: PESSIMISTA | 30%, REALISTA | 50% (destaque vermelho), OTIMISTA | 70%. Nota: "Valores por ano. % de casos resolvidos pela solução."
- Embaixo: Critérios de sucesso da PoC (`[a ser preenchido]`) e Riscos (bullets).
- Selo "EXPERIMENTAÇÃO | CoE Digital" no pé, à esquerda.
- Se o texto não couber, reduza a fonte da área branca aos poucos até caber; nunca corte texto.

## Banco de dados (Supabase)

Tabela `demandas` (sugestão; ajuste se precisar): código, data de envio, todos os campos do Passo 1, itens confirmados no Passo 3 (resumo, nome, hipótese, riscos), etapa atual na esteira (começa em "Mapeamento de problemas"), histórico de mudanças de etapa, caminho dos anexos no Storage e do PDF do canvas. Ative Row Level Security: quem enviou vê só as próprias demandas; o time InovAI (lista de e-mails em variável de ambiente) vê e altera todas.

## Visual

- Fonte Roboto. Cores: vermelho #E2262B, vermelho escuro #C00000, tinta #262626, tinta suave #53585F, linhas #D9D9D9, fundo #F5F3F1, rosa #FDEEEE, amarelo #FFC000, laranja #F58428, cinza #898989.
- Sem logo nem marca de empresa. A marca do Prisma é o prisma de vidro.
- Acessibilidade: rótulos ligados aos campos, foco visível, contraste adequado, campos obrigatórios marcados para leitor de tela.

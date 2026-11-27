# Plano de construção do Prisma

Cada fatia termina com algo que você consegue testar. Só passe para a próxima depois de testar e aprovar. Em cada fatia, copie o pedido abaixo e cole no Claude Code.

## Antes de começar
Siga o `PASSO-A-PASSO.md` (contas e instalação). Depois, abra o Claude Code dentro desta pasta.

## Fatia 0: preparar o projeto
**Pedido:**
> Leia o CLAUDE.md e o arquivo de referência. Crie o projeto Next.js com TypeScript nesta pasta, configure o Git com o repositório do GitHub que eu criei (vou te passar o endereço) e faça o primeiro commit. Me explique como abrir a aplicação no navegador.

**Você testa:** a aplicação abre no navegador com uma página simples.

## Fatia 1: as telas, sem banco e sem IA
**Pedido:**
> Construa todas as telas do Prisma como descrito no CLAUDE.md: página inicial, Passo 1, Passo 2, Passo 3 e tela final com o canvas. Por enquanto, use as regras de fallback (sem IA) para o Passo 3 e guarde os dados só na memória do navegador. Tem que funcionar no computador e no celular.

**Você testa:** o fluxo completo com "Preencher com exemplo" e com um problema seu; o visual no celular (use o modo celular do navegador); o canvas da tela final.

## Fatia 2: banco de dados e código da demanda
**Pedido:**
> Conecte o Supabase. Ao enviar, salve a demanda com o código PR-MMAA-NNNN, os anexos no Storage e os itens confirmados. Faça a consulta pelo código mostrar a etapa real na esteira.

**Você testa:** enviar dois problemas e ver os códigos 0001 e 0002 do mês; ver as demandas no painel do Supabase; consultar um código na página inicial.

## Fatia 3: IA de verdade
**Pedido:**
> Ligue a IA (Gemini, chave no .env.local) para gerar resumo, nome, hipótese e riscos, seguindo as regras do CLAUDE.md. Valide o JSON da resposta e use o fallback se a IA falhar ou estourar o limite.

**Você testa:** relatos diferentes (endereço, documentos, fatura, algo sem tema claro) e conferir se o nome segue a regra, se a hipótese está no formato e se nada trava quando a IA falha.

## Fatia 4: canvas em PDF e e-mail
**Pedido:**
> Gere o PDF do canvas (1920 x 1080, igual à tela), com o código no nome do arquivo, guarde no Storage e envie por e-mail para quem enviou a demanda.

**Você testa:** baixar o PDF, abrir e comparar com a tela; receber o e-mail.

## Fatia 5: login e área do time InovAI
**Pedido:**
> Adicione login por link no e-mail (Supabase Auth). Crie a área do time InovAI: lista de demandas, filtro por etapa, detalhe da demanda e botão para mudar a etapa na esteira, com histórico.

**Você testa:** entrar com seu e-mail, ver a lista, mudar a etapa de uma demanda e consultar o código para ver a etapa nova.

## Depois
- Publicar na internet (Netlify, Cloudflare Pages, Render ou Vercel; confira as regras do plano gratuito para o seu uso).
- Trocar o Gemini gratuito por uma IA paga antes de receber problemas reais.

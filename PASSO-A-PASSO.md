# Passo a passo para começar

## 1. Claude Code
- Baixe o app do Claude para desktop: https://claude.com/download (dá para usar o Claude Code sem terminal).
- Ou, no PowerShell: `irm https://claude.ai/install.ps1 | iex`
- Entre com a sua conta do Claude (o Claude Code exige plano Pro ou superior).
- Se o computador da empresa bloquear a instalação, use um computador pessoal.

## 2. GitHub
- Entre em https://github.com com a sua conta.
- Crie um repositório novo, privado, chamado `prisma-experimentacao`, sem arquivos.
- Guarde o endereço do repositório: você vai passar para o Claude Code na Fatia 0.

## 3. Supabase (banco de dados, gratuito)
- Crie uma conta em https://supabase.com (não pede cartão).
- Crie um projeto chamado `prisma`, região São Paulo (sa-east-1), e anote a senha do banco num lugar seguro.
- Em Project Settings > API, copie a Project URL e a chave anon. Você vai colar no arquivo `.env.local` quando o Claude Code pedir (Fatia 2).
- Projetos gratuitos pausam depois de 7 dias sem uso: basta reativar no painel.

## 4. Gemini (IA, gratuito)
- Entre em https://aistudio.google.com com uma conta Google pessoal.
- Gere uma API key e guarde. Você vai colar no `.env.local` na Fatia 3.
- No plano gratuito, os dados enviados podem ser usados pelo Google para treinar modelos: use só exemplos fictícios.

## 5. Começar
- Abra o Claude Code nesta pasta.
- Diga: "Leia o CLAUDE.md e o PLANO.md e vamos começar pela Fatia 0."

-- Prisma de Experimentação: banco inicial (Fatia 2)
-- Como usar: no painel do Supabase, abra SQL Editor > New query, cole este arquivo inteiro e clique em Run.
-- Pode rodar mais de uma vez sem estragar nada.

-- 1. Demandas --------------------------------------------------------------

create table if not exists public.demandas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  enviado_em timestamptz not null default now(),

  -- Passo 1: o que a pessoa contou
  problema text not null,
  volume_mes numeric,                 -- vazio quando "Não sei agora"
  volume_nao_sei boolean not null default false,
  valor_caso numeric,                 -- opcional
  ganho_principal text not null,
  justificativa_principal text not null,
  ganhos_secundarios text[] not null default '{}',
  justificativas_secundarias jsonb not null default '{}',
  evidencias_texto text,
  links text[] not null default '{}',
  anexos text[] not null default '{}',   -- caminhos dos arquivos no Storage
  produto text not null,
  time_recebedor text not null,
  stakeholders text,
  nome text not null,
  area text not null,
  email text not null,
  usou_exemplo boolean not null default false,

  -- Passo 3: itens confirmados
  resumo text not null,
  nome_solucao text not null,
  hipotese text not null,
  riscos text not null,

  -- Esteira
  etapa text not null default 'Mapeamento de problemas',
  pdf_canvas text,                    -- caminho do PDF no Storage (Fatia 4)

  constraint demandas_etapa_valida check (etapa in (
    'Mapeamento de problemas', 'Desenho de solução', 'Prototipação', 'Testes',
    'Decisão de pilotar', 'Priorização', 'Piloto', 'Crescimento'
  ))
);

-- 2. Histórico de mudanças de etapa ---------------------------------------

create table if not exists public.historico_etapas (
  id bigint generated always as identity primary key,
  demanda_id uuid not null references public.demandas(id) on delete cascade,
  etapa text not null,
  alterado_em timestamptz not null default now(),
  alterado_por text
);

create index if not exists historico_etapas_demanda_idx on public.historico_etapas (demanda_id);

-- 3. Sequência do código por mês ------------------------------------------

create table if not exists public.sequencias_mes (
  mmaa text primary key,
  ultimo integer not null
);

-- 4. Segurança: Row Level Security ligado e nenhuma regra de acesso público.
-- Assim, ninguém de fora lê nem grava. Só o servidor da aplicação (com a chave secreta) acessa.
-- As regras por pessoa e do time InovAI entram na Fatia 5, junto com o login.

alter table public.demandas enable row level security;
alter table public.historico_etapas enable row level security;
alter table public.sequencias_mes enable row level security;

-- Projetos novos do Supabase não dão acesso automático às tabelas: libera só para o servidor.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.demandas, public.historico_etapas, public.sequencias_mes to service_role;
grant usage, select on all sequences in schema public to service_role;

-- 5. Função que cria a demanda e gera o código PR-MMAA-NNNN ---------------
-- O "insert ... on conflict do update" trava a linha do mês, então dois envios
-- ao mesmo tempo nunca recebem o mesmo número.

create or replace function public.criar_demanda(d jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mmaa text := to_char(now() at time zone 'America/Sao_Paulo', 'MMYY');
  v_seq integer;
  v_codigo text;
  v_id uuid;
begin
  insert into sequencias_mes as s (mmaa, ultimo)
  values (v_mmaa, 1)
  on conflict (mmaa) do update set ultimo = s.ultimo + 1
  returning s.ultimo into v_seq;

  v_codigo := 'PR-' || v_mmaa || '-' ||
    case when v_seq < 10000 then lpad(v_seq::text, 4, '0') else v_seq::text end;

  insert into demandas (
    codigo, problema, volume_mes, volume_nao_sei, valor_caso,
    ganho_principal, justificativa_principal, ganhos_secundarios, justificativas_secundarias,
    evidencias_texto, links, produto, time_recebedor, stakeholders,
    nome, area, email, usou_exemplo,
    resumo, nome_solucao, hipotese, riscos
  ) values (
    v_codigo,
    d->>'problema',
    nullif(d->>'volume_mes', '')::numeric,
    coalesce((d->>'volume_nao_sei')::boolean, false),
    nullif(d->>'valor_caso', '')::numeric,
    d->>'ganho_principal',
    d->>'justificativa_principal',
    coalesce(array(select jsonb_array_elements_text(d->'ganhos_secundarios')), '{}'),
    coalesce(d->'justificativas_secundarias', '{}'::jsonb),
    nullif(d->>'evidencias_texto', ''),
    coalesce(array(select jsonb_array_elements_text(d->'links')), '{}'),
    d->>'produto',
    d->>'time_recebedor',
    nullif(d->>'stakeholders', ''),
    d->>'nome',
    d->>'area',
    d->>'email',
    coalesce((d->>'usou_exemplo')::boolean, false),
    d->>'resumo',
    d->>'nome_solucao',
    d->>'hipotese',
    d->>'riscos'
  )
  returning id into v_id;

  insert into historico_etapas (demanda_id, etapa, alterado_por)
  values (v_id, 'Mapeamento de problemas', 'envio');

  return v_codigo;
end;
$$;

-- Só o servidor (chave secreta) pode chamar a função.
revoke all on function public.criar_demanda(jsonb) from public, anon, authenticated;
grant execute on function public.criar_demanda(jsonb) to service_role;

-- 6. Pasta privada para os anexos (até 10 MB por arquivo) ----------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('anexos', 'anexos', false, 10485760)
on conflict (id) do nothing;

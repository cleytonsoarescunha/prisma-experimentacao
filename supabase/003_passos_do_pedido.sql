-- Prisma de Experimentação: passos do pedido
-- As etapas 1 e 2 da esteira passam a ser detalhadas em 5 passos do pedido:
--   Etapa 1, Mapeamento de problemas: Demanda recebida > Reunião inicial agendada
--   Etapa 2, Desenho de solução: Priorização de estudos > Validação e métricas da PoC > Em desenvolvimento
-- Da etapa 3 (Prototipação) em diante, a coluna guarda o nome da etapa, como antes.
-- Como usar: SQL Editor > New query, cole este arquivo e clique em Run. Pode rodar mais de uma vez.

-- 1. As demandas de teste que já existem vão para o primeiro passo
alter table public.demandas drop constraint if exists demandas_etapa_valida;
update public.demandas set etapa = 'Demanda recebida' where etapa in ('Mapeamento de problemas', 'Desenho de solução');
update public.historico_etapas set etapa = 'Demanda recebida' where etapa = 'Mapeamento de problemas' and alterado_por = 'envio';
-- A última etapa da esteira mudou de nome: "Crescimento" virou "Transferência de conhecimento"
-- (a solução passa para o time recebedor, que faz a governança e a evolução).
update public.demandas set etapa = 'Transferência de conhecimento' where etapa in ('Crescimento', 'Entrega ao time recebedor');
update public.historico_etapas set etapa = 'Transferência de conhecimento' where etapa in ('Crescimento', 'Entrega ao time recebedor');

-- 2. Situações aceitas na coluna etapa: os 5 passos e as etapas 3 a 8 da esteira
alter table public.demandas add constraint demandas_etapa_valida check (etapa in (
  'Demanda recebida', 'Reunião inicial agendada',
  'Priorização de estudos', 'Validação e métricas da PoC', 'Em desenvolvimento',
  'Prototipação', 'Testes', 'Decisão de pilotar', 'Priorização', 'Piloto', 'Transferência de conhecimento'
));

-- 3. Toda demanda nova começa em "Demanda recebida"
alter table public.demandas alter column etapa set default 'Demanda recebida';

-- 4. A função de criar demanda passa a registrar "Demanda recebida" no histórico
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
    resumo, nome_solucao, hipotese, riscos, etapa
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
    d->>'riscos',
    'Demanda recebida'
  )
  returning id into v_id;

  insert into historico_etapas (demanda_id, etapa, alterado_por)
  values (v_id, 'Demanda recebida', 'envio');

  return v_codigo;
end;
$$;

revoke all on function public.criar_demanda(jsonb) from public, anon, authenticated;
grant execute on function public.criar_demanda(jsonb) to service_role;

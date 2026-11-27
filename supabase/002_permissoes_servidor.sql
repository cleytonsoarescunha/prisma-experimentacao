-- Prisma de Experimentação: permissões do servidor (Fatia 2)
-- Projetos novos do Supabase não dão acesso automático às tabelas criadas por SQL.
-- Este arquivo libera as tabelas só para o servidor da aplicação (papel service_role, usado pela chave secreta).
-- O público (anon) e quem fizer login (authenticated) continuam sem acesso.
-- Como usar: SQL Editor > New query, cole este arquivo e clique em Run. Pode rodar mais de uma vez.

grant usage on schema public to service_role;
grant select, insert, update, delete on public.demandas to service_role;
grant select, insert, update, delete on public.historico_etapas to service_role;
grant select, insert, update, delete on public.sequencias_mes to service_role;
grant usage, select on all sequences in schema public to service_role;

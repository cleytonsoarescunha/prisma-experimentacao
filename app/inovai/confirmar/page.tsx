// Destino do link de acesso do e-mail. Só mostra o botão "Entrar na área restrita":
// abrir esta página não gasta o link (os robôs de segurança dos e-mails corporativos abrem links sozinhos).
// O link é conferido em /api/inovai/entrar, quando a pessoa clica no botão.

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { ConfirmarEntrada, MolduraTime } from "@/components/AreaTime";

export const metadata: Metadata = { title: "Entrar · Área do time InovAI", robots: { index: false, follow: false } };

export default function Page(props: PageProps<"/inovai/confirmar">) {
  return (
    <Suspense fallback={<MolduraTime>{null}</MolduraTime>}>
      <Conteudo {...props} />
    </Suspense>
  );
}

async function Conteudo({ searchParams }: PageProps<"/inovai/confirmar">) {
  await connection();
  const { token } = await searchParams;
  if (typeof token !== "string" || !token) redirect("/inovai/entrar?erro=link");
  return (
    <MolduraTime>
      <ConfirmarEntrada token={token} />
    </MolduraTime>
  );
}

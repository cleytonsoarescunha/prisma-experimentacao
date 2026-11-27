import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { FormEntrar, MolduraTime } from "@/components/AreaTime";
import { usuarioDoTime } from "@/lib/equipe";

export const metadata: Metadata = { title: "Entrar · Área do time InovAI", robots: { index: false, follow: false } };

export default function Page(props: PageProps<"/inovai/entrar">) {
  return (
    <Suspense fallback={<MolduraTime>{null}</MolduraTime>}>
      <Conteudo {...props} />
    </Suspense>
  );
}

async function Conteudo({ searchParams }: PageProps<"/inovai/entrar">) {
  // Quem já está conectado vai direto para a lista.
  if (await usuarioDoTime()) redirect("/inovai");
  const { erro } = await searchParams;
  return (
    <MolduraTime>
      <FormEntrar erroLink={erro === "link"} />
    </MolduraTime>
  );
}

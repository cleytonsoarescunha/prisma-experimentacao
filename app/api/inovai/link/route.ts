// Pede o link de acesso à área do time. Só envia para e-mails da lista INOVAI_EMAILS.
// A resposta é sempre a mesma, para ninguém descobrir quais e-mails estão na lista.

import { enviarEmailAcesso } from "@/lib/email";
import { ehDoTime, gerarTokenDeAcesso } from "@/lib/equipe";

/** Tempo mínimo entre dois pedidos de link para o mesmo e-mail. */
const ESPERA_SEGUNDOS = 60;
const RESPOSTA = { mensagem: "Se este e-mail faz parte do time InovAI, o link de acesso chega em instantes. Confira também o spam.", espera: ESPERA_SEGUNDOS };

/** Último pedido por e-mail (em memória do servidor). Vale igual para quem está ou não na lista, para não revelar nada. */
const ultimosPedidos = new Map<string, number>();

export async function POST(request: Request) {
  const corpo = await request.json().catch(() => ({}));
  const email = typeof corpo.email === "string" ? corpo.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ erro: "Digite um e-mail válido." }, { status: 400 });

  const agora = Date.now();
  const desde = (agora - (ultimosPedidos.get(email) || 0)) / 1000;
  if (desde < ESPERA_SEGUNDOS) {
    const falta = Math.ceil(ESPERA_SEGUNDOS - desde);
    return Response.json({ erro: `Aguarde ${falta} segundos para pedir um novo link.`, espera: falta }, { status: 429 });
  }
  ultimosPedidos.set(email, agora);
  // Limpa pedidos antigos para a lista não crescer sem fim.
  if (ultimosPedidos.size > 500) {
    for (const [e, t] of ultimosPedidos) if (agora - t > ESPERA_SEGUNDOS * 1000) ultimosPedidos.delete(e);
  }

  if (ehDoTime(email)) {
    try {
      const token = await gerarTokenDeAcesso(email);
      const link = `${new URL(request.url).origin}/inovai/confirmar?token=${encodeURIComponent(token)}`;
      const enviado = await enviarEmailAcesso(email, link);
      // Se o envio falhou, libera tentar de novo na hora.
      if (!enviado) ultimosPedidos.delete(email);
      if (!enviado) return Response.json({ erro: "Não foi possível enviar o e-mail agora. Tente de novo em instantes." }, { status: 500 });
    } catch (e) {
      ultimosPedidos.delete(email);
      console.error("[acesso] erro ao gerar o link:", e instanceof Error ? e.message : e);
      return Response.json({ erro: "Não foi possível gerar o link agora. Tente de novo em instantes." }, { status: 500 });
    }
  } else {
    console.warn("[acesso] pedido de link para e-mail fora da lista do time.");
  }
  return Response.json(RESPOSTA);
}

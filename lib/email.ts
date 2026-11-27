// Envio de e-mail pelo Gmail, com uma "senha de app" do Google. Só roda no servidor; a senha fica no .env.local.
// Para trocar de serviço no futuro, basta trocar a função enviarPorGmail mantendo a mesma Mensagem.

import "server-only";
import nodemailer from "nodemailer";

const escapar = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

interface Mensagem {
  para: string;
  assunto: string;
  html: string;
  texto: string;
  anexo: { nome: string; conteudo: Buffer } | null;
}

/** Gmail por SMTP. O nome que aparece como remetente vem de EMAIL_NOME_REMETENTE. */
async function enviarPorGmail(m: Mensagem): Promise<boolean> {
  const usuario = process.env.GMAIL_USUARIO?.trim();
  const senha = process.env.GMAIL_SENHA_APP?.replace(/\s+/g, "");
  if (!usuario || !senha) {
    console.warn("[email] GMAIL_USUARIO ou GMAIL_SENHA_APP não configurados; e-mail não enviado.");
    return false;
  }
  const nome = process.env.EMAIL_NOME_REMETENTE?.trim() || "Prisma de Experimentação";
  const transporte = nodemailer.createTransport({
    service: "gmail",
    auth: { user: usuario, pass: senha },
    connectionTimeout: 15000,
    socketTimeout: 20000,
  });
  await transporte.sendMail({
    from: { name: nome, address: usuario },
    to: m.para,
    subject: m.assunto,
    html: m.html,
    text: m.texto,
    attachments: m.anexo ? [{ filename: m.anexo.nome, content: m.anexo.conteudo, contentType: "application/pdf" }] : undefined,
  });
  return true;
}

/** Envia para quem contou o problema o código da demanda e o canvas em PDF. Devolve true se o envio foi aceito. */
export async function enviarEmailCanvas(dados: { para: string; nome: string; codigo: string; nomeSolucao: string; pdf: Buffer | null }): Promise<boolean> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.para.trim())) {
    console.warn("[email] endereço do destinatário inválido; e-mail não enviado.");
    return false;
  }
  const primeiroNome = dados.nome.trim().split(/\s+/)[0] || "";
  const ola = primeiroNome && !primeiroNome.startsWith("[") ? `Olá, ${escapar(primeiroNome)}!` : "Olá!";
  const temNome = !!dados.nomeSolucao.trim() && !dados.nomeSolucao.startsWith("[");
  const recebemos = temNome ? `Recebemos o seu problema: <strong>${escapar(dados.nomeSolucao.trim())}</strong>.` : "Recebemos o seu problema.";

  const html = `<div style="font-family: Roboto, Arial, sans-serif; color: #262626; font-size: 16px; line-height: 24px; max-width: 560px">
  <p>${ola}</p>
  <p>${recebemos}</p>
  <p style="margin: 20px 0">Código da demanda:<br><strong style="font-size: 22px; color: #c00000; letter-spacing: 0.02em">${escapar(dados.codigo)}</strong></p>
  <p>${dados.pdf ? "O canvas pré-preenchido está em anexo, no arquivo " + escapar(dados.codigo) + ".pdf." : "O canvas pré-preenchido pode ser baixado na tela de confirmação do Prisma."}</p>
  <p><strong>Próximo passo:</strong> o time InovAI vai entrar em contato para agendar a reunião inicial, em que validamos as informações e aprofundamos o problema.</p>
  <p>Use o código acima para acompanhar em que passo o seu pedido está, na página inicial do Prisma.</p>
  <p style="color: #53585f; font-size: 14px">Time InovAI · Experimentação</p>
</div>`;

  const texto = [
    ola,
    "",
    temNome ? `Recebemos o seu problema: ${dados.nomeSolucao.trim()}.` : "Recebemos o seu problema.",
    `Código da demanda: ${dados.codigo}`,
    dados.pdf ? `O canvas pré-preenchido está em anexo (${dados.codigo}.pdf).` : "O canvas pré-preenchido pode ser baixado na tela de confirmação do Prisma.",
    "",
    "Próximo passo: o time InovAI vai entrar em contato para agendar a reunião inicial.",
    "",
    "Time InovAI · Experimentação",
  ].join("\n");

  try {
    return await enviarPorGmail({
      para: dados.para.trim(),
      assunto: `InovAI | Recebemos o seu problema: ${dados.codigo}`,
      html,
      texto,
      anexo: dados.pdf ? { nome: `${dados.codigo}.pdf`, conteudo: dados.pdf } : null,
    });
  } catch (e) {
    // Não registra a mensagem inteira: só o motivo curto (nunca a senha).
    console.warn("[email] Gmail falhou:",e instanceof Error ? e.message.slice(0, 200) : e);
    return false;
  }
}

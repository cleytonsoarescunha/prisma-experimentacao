// Gera o PDF do canvas (1920 x 1080) no navegador de quem está usando o Prisma.
// O canvas é desenhado fora da área visível, com a mesma redução de fonte da tela,
// fotografado em alta resolução e colocado numa página de PDF do mesmo tamanho.
// Assim o PDF fica igual à tela, sem precisar de um navegador no servidor.

import { createRoot } from "react-dom/client";
import type { DadosCanvas } from "./regras";
import { CanvasPdf } from "@/components/Canvas";

const LARGURA = 1920;
const ALTURA = 1080;

async function esperarPronto(caixa: HTMLElement, limiteMs = 6000): Promise<HTMLElement> {
  const inicio = Date.now();
  for (;;) {
    const pronto = caixa.querySelector<HTMLElement>('[data-canvas-pronto="sim"]');
    if (pronto) return pronto;
    if (Date.now() - inicio > limiteMs) throw new Error("O canvas não terminou de ser desenhado.");
    await new Promise((r) => setTimeout(r, 50));
  }
}

/** Devolve o PDF do canvas como arquivo (Blob). */
export async function gerarPdfCanvas(d: DadosCanvas): Promise<Blob> {
  const [{ domToJpeg }, { jsPDF }] = await Promise.all([import("modern-screenshot"), import("jspdf")]);

  const caixa = document.createElement("div");
  caixa.setAttribute("aria-hidden", "true");
  Object.assign(caixa.style, { position: "fixed", left: "-30000px", top: "0", width: LARGURA + "px", height: ALTURA + "px", pointerEvents: "none" });
  document.body.appendChild(caixa);
  const raiz = createRoot(caixa);
  try {
    raiz.render(<CanvasPdf d={d} />);
    const alvo = await esperarPronto(caixa);
    await document.fonts.ready;
    const imagem = await domToJpeg(alvo, { width: LARGURA, height: ALTURA, scale: 1.5, quality: 0.92, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [LARGURA, ALTURA], hotfixes: ["px_scaling"], compress: true });
    pdf.addImage(imagem, "JPEG", 0, 0, LARGURA, ALTURA);
    return pdf.output("blob");
  } finally {
    raiz.unmount();
    caixa.remove();
  }
}

/** Faz o navegador baixar um arquivo. */
export function baixarArquivo(arquivo: Blob, nome: string) {
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

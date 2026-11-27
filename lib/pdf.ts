// Gera o PDF do canvas (1920 x 1080) abrindo a página interna do canvas num navegador invisível (Playwright).
// Assim o PDF sai exatamente igual ao canvas da tela, inclusive com a redução automática de fonte.

import "server-only";
import { chromium, type Browser } from "playwright";
import { assinar } from "./assinatura";
import { PASTA_ANEXOS, supabaseServidor } from "./supabase-servidor";

let navegador: Promise<Browser> | null = null;

/** Reaproveita o mesmo navegador entre um PDF e outro (abrir um novo leva alguns segundos). */
function abrirNavegador(): Promise<Browser> {
  if (!navegador) {
    navegador = chromium.launch().then((b) => {
      b.on("disconnected", () => (navegador = null));
      return b;
    });
    navegador.catch(() => (navegador = null));
  }
  return navegador;
}

/** Caminho do PDF no Storage: fica na mesma pasta dos anexos da demanda. */
export const caminhoPdf = (codigo: string) => `${codigo}/${codigo}.pdf`;

/**
 * Desenha o canvas da demanda e devolve o PDF.
 * origem: endereço do próprio site (ex.: http://localhost:3000), tirado da requisição.
 */
export async function gerarPdfCanvas(codigo: string, origem: string): Promise<Buffer> {
  const browser = await abrirNavegador();
  const pagina = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  try {
    const url = `${origem}/interno/canvas/${encodeURIComponent(codigo)}?t=${encodeURIComponent(assinar(codigo))}`;
    await pagina.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await pagina.waitForSelector('[data-canvas-pronto="sim"]', { timeout: 15000 });
    await pagina.evaluate(() => document.fonts.ready);
    return await pagina.pdf({ width: "1920px", height: "1080px", printBackground: true, pageRanges: "1" });
  } finally {
    await pagina.close().catch(() => {});
  }
}

/** Gera o PDF e guarda no Storage. Devolve o PDF, ou null se algo falhar (a demanda segue sem ele). */
export async function gerarEGuardarPdf(codigo: string, origem: string): Promise<Buffer | null> {
  try {
    const pdf = await gerarPdfCanvas(codigo, origem);
    const supabase = supabaseServidor();
    const caminho = caminhoPdf(codigo);
    const { error } = await supabase.storage.from(PASTA_ANEXOS).upload(caminho, pdf, { contentType: "application/pdf", upsert: true });
    if (error) {
      console.error("[pdf] erro ao guardar no Storage:", error.message);
    } else {
      const { error: e } = await supabase.from("demandas").update({ pdf_canvas: caminho }).eq("codigo", codigo);
      if (e) console.error("[pdf] erro ao registrar o caminho:", e.message);
    }
    return pdf;
  } catch (e) {
    console.error("[pdf] não foi possível gerar:", e instanceof Error ? e.message : e);
    return null;
  }
}

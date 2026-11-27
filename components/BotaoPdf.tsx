"use client";

// Botão "Baixar [código].pdf" da área restrita. Usa o PDF guardado no Storage (link temporário);
// se a demanda não tiver PDF guardado, gera na hora, aqui no navegador, a partir do canvas.

import { useState } from "react";
import { COR } from "./ui";
import type { DadosCanvas } from "@/lib/regras";
import { baixarArquivo, gerarPdfCanvas } from "@/lib/pdf-navegador";

export default function BotaoPdf({ codigo, linkGuardado, dados }: { codigo: string; linkGuardado: string | null; dados: DadosCanvas }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);
  const estilo = { minHeight: 44, padding: "10px 20px", border: `2px solid ${COR.vermelho}`, borderRadius: 9999, background: "#ffffff", color: COR.vermelhoEscuro, fontSize: 15, fontWeight: 700, textDecoration: "none" } as const;

  if (linkGuardado) {
    return (
      <a href={linkGuardado} download={`${codigo}.pdf`} style={estilo}>
        Baixar {codigo}.pdf
      </a>
    );
  }

  async function gerar() {
    setGerando(true);
    setErro(false);
    try {
      baixarArquivo(await gerarPdfCanvas(dados), `${codigo}.pdf`);
    } catch {
      setErro(true);
    }
    setGerando(false);
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button type="button" onClick={gerar} disabled={gerando} style={estilo}>
        {gerando ? "Gerando PDF..." : `Baixar ${codigo}.pdf`}
      </button>
      {erro && (
        <span role="alert" style={{ fontSize: 13, color: COR.erro, fontWeight: 700 }}>
          Não foi possível gerar o PDF agora.
        </span>
      )}
    </span>
  );
}

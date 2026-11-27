// Peças pequenas reaproveitadas nas telas: rótulos com OBRIGATÓRIO/OPCIONAL, botões e ícones.

import type { CSSProperties, ReactNode } from "react";

export const COR = {
  vermelho: "#e2262b",
  vermelhoEscuro: "#c00000",
  erro: "#960000",
  tinta: "#262626",
  suave: "#53585f",
  linhas: "#d9d9d9",
  fundo: "#f5f3f1",
  rosa: "#fdeeee",
  amarelo: "#ffc000",
  laranja: "#f58428",
  cinza: "#898989",
  cinzaBorda: "#bfbfbf",
};

export function Chip({ obrigatorio }: { obrigatorio: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        padding: "2px 10px",
        borderRadius: 9999,
        background: obrigatorio ? COR.vermelho : COR.linhas,
        color: obrigatorio ? "#ffffff" : COR.tinta,
        fontSize: 11,
        lineHeight: "16px",
        fontWeight: 700,
        letterSpacing: "0.08em",
      }}
    >
      {obrigatorio ? "OBRIGATÓRIO" : "OPCIONAL"}
    </span>
  );
}

/**
 * Rótulo ligado ao campo, com a etiqueta OBRIGATÓRIO ou OPCIONAL ao lado.
 * Com obrigatorio = null, fica sem etiqueta (campos com a caixa "Não sei agora", que já explica o que fazer).
 */
export function Rotulo({
  htmlFor,
  id,
  children,
  obrigatorio,
  tamanho = 16,
}: {
  htmlFor?: string;
  id?: string;
  children: ReactNode;
  obrigatorio: boolean | null;
  tamanho?: number;
}) {
  const estilo: CSSProperties = { fontSize: tamanho, lineHeight: tamanho + 6 + "px", fontWeight: 700, margin: 0 };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {htmlFor ? (
        <label htmlFor={htmlFor} id={id} style={estilo}>
          {children}
        </label>
      ) : (
        <p id={id} style={estilo}>
          {children}
        </p>
      )}
      {obrigatorio !== null && <Chip obrigatorio={obrigatorio} />}
    </div>
  );
}

export function Ajuda({ children, id, tamanho = 14 }: { children: ReactNode; id?: string; tamanho?: number }) {
  return (
    <p id={id} style={{ margin: 0, fontSize: tamanho, lineHeight: tamanho + 6 + "px", color: COR.suave }}>
      {children}
    </p>
  );
}

export function Sobretitulo({ children, cor = COR.vermelho }: { children: ReactNode; cor?: string }) {
  return (
    <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", fontWeight: 700, letterSpacing: "0.12em", color: cor }}>
      {children}
    </p>
  );
}

export const estiloCampo = (borda: string, extra?: CSSProperties): CSSProperties => ({
  width: "100%",
  minHeight: 48,
  padding: "10px 14px",
  border: `2px solid ${borda}`,
  borderRadius: 10,
  fontSize: 16,
  background: "#ffffff",
  color: COR.tinta,
  ...extra,
});

export const estiloTexto = (borda: string, extra?: CSSProperties): CSSProperties => ({
  width: "100%",
  padding: "12px 14px",
  border: `2px solid ${borda}`,
  borderRadius: 10,
  fontSize: 16,
  lineHeight: "24px",
  resize: "vertical",
  background: "#ffffff",
  color: COR.tinta,
  ...extra,
});

export const botaoPrimario: CSSProperties = {
  minHeight: 48,
  padding: "12px 28px",
  border: "none",
  borderRadius: 9999,
  background: COR.vermelho,
  color: "#ffffff",
  fontSize: 16,
  fontWeight: 700,
};

export const botaoSecundario: CSSProperties = {
  minHeight: 48,
  padding: "12px 22px",
  border: `2px solid ${COR.vermelho}`,
  borderRadius: 9999,
  background: "#ffffff",
  color: COR.vermelhoEscuro,
  fontSize: 15,
  fontWeight: 700,
};

export function IconeFrasco({ tamanho = 26 }: { tamanho?: number }) {
  return (
    <svg aria-hidden="true" width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6" />
      <path d="M10 3v6.5L4.6 18.2A1.8 1.8 0 0 0 6.1 21h11.8a1.8 1.8 0 0 0 1.5-2.8L14 9.5V3" />
      <path d="M7 15h10" />
    </svg>
  );
}

import { useId, type CSSProperties } from "react";

/**
 * O prisma de vidro, marca do Prisma (SVG copiado do protótipo).
 * "claro": versão sobre fundo claro. "hero": versão branca sobre a faixa vermelha.
 */
export default function PrismaVidro({
  variante = "claro",
  animado = false,
  style,
  className,
}: {
  variante?: "claro" | "hero";
  animado?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  const p = "pz" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const hero = variante === "hero";

  const espectro = hero
    ? ["#5b2ea6", "#2a6be0", "#1fb5c9", "#43c463", "#ffe14d", "#ffffff"]
    : ["#4b2a91", "#1f5fd1", "#1aa8b0", "#3bbf3b", "#ffd400", "#ff8a00", "#e2262b"];

  return (
    <svg
      role="img"
      aria-label="Prisma de vidro refratando a luz em cores"
      viewBox="0 0 900 700"
      className={className}
      style={{ height: "auto", display: "block", ...style }}
    >
      <defs>
        <linearGradient id={p + "Sp"} gradientUnits="userSpaceOnUse" x1="840" y1="90" x2="880" y2="300">
          {espectro.map((c, i) => (
            <stop key={i} offset={(i / (espectro.length - 1)).toFixed(3)} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={p + "Beam"} x1="0" y1="0" x2="1" y2="0">
          {hero ? (
            <>
              <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#ffffff" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#d9d9d9" stopOpacity="0" />
              <stop offset="0.35" stopColor="#bfbfbf" />
              <stop offset="1" stopColor="#898989" />
            </>
          )}
        </linearGradient>
        <linearGradient id={p + "L"} x1="0" y1="0" x2="1" y2="1">
          {hero ? (
            <>
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="0.55" stopColor="#f3c2c3" stopOpacity="0.3" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#8a8f96" stopOpacity="0.55" />
              <stop offset="0.55" stopColor="#c9cdd2" stopOpacity="0.45" />
              <stop offset="1" stopColor="#eef0f2" stopOpacity="0.6" />
            </>
          )}
        </linearGradient>
        <linearGradient id={p + "F"} x1="0.2" y1="0" x2="0.8" y2="1">
          {hero ? (
            <>
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.42" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="0.6" stopColor="#d5d8dc" stopOpacity="0.55" />
              <stop offset="1" stopColor="#b4b9bf" stopOpacity="0.6" />
            </>
          )}
        </linearGradient>
        <linearGradient id={p + "Ray"} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.4" stopColor="#7f5af0" />
          <stop offset="0.7" stopColor="#1fb5a0" />
          <stop offset="1" stopColor="#ff5a1f" />
        </linearGradient>
        <radialGradient id={p + "Glow"} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={p + "Sh"} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={hero ? "#7a0000" : "#262626"} stopOpacity={hero ? "0.45" : "0.2"} />
          <stop offset="1" stopColor="#262626" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M30 200 L231 361" stroke={`url(#${p}Beam)`} strokeWidth={hero ? 13 : 12} strokeLinecap="round" />
      <polygon
        className={animado ? "pz-esp" : undefined}
        points="515,362 840,90 900,300 515,370"
        fill={`url(#${p}Sp)`}
      />
      <ellipse cx="380" cy="640" rx="340" ry="30" fill={`url(#${p}Sh)`} />
      <path
        d="M352 80 L537 503 M60 561 L537 503 L667 617"
        fill="none"
        stroke={hero ? "#ffffff" : "#898989"}
        strokeWidth="2"
        opacity="0.35"
      />
      <polygon points="352,80 60,561 195,645" fill={`url(#${p}L)`} />
      <polygon points="352,80 195,645 667,617" fill={`url(#${p}F)`} />
      <polygon points="352,80 242,600 280,612" fill="#ffffff" opacity={hero ? 0.18 : 0.45} />
      <polygon points="60,561 195,645 667,617 537,503" fill="#ffffff" opacity="0.12" />
      <path d="M231 361 L515 366" stroke={`url(#${p}Ray)`} strokeWidth="5" strokeLinecap="round" />
      <circle cx="231" cy="361" r="38" fill={`url(#${p}Glow)`} />
      <path
        d="M60 561 L352 80 L667 617 L195 645 Z M352 80 L195 645"
        fill="none"
        stroke={hero ? "#ffffff" : "#53585f"}
        strokeWidth="3"
        strokeLinejoin="round"
        opacity={hero ? 0.85 : 0.7}
      />
      <path d="M352 80 L195 645" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

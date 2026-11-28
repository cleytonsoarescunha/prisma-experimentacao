// Rodapé do Prisma, igual em todas as telas (site e área restrita).

import { COR, IconeFrasco } from "./ui";

/** E-mail do criador, para o link "Criado por" do rodapé. */
const CONTATO_CRIADOR = "cleytonsoarescunha@gmail.com";

export default function Rodape() {
  return (
    <footer className="pz-x" style={{ width: "100%", maxWidth: 1240, margin: "0 auto", paddingTop: 8, paddingBottom: 96, flex: "none", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", borderTop: `1px solid ${COR.linhas}`, paddingTop: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 44, height: 44, background: COR.vermelho, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconeFrasco />
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.08em", color: COR.vermelhoEscuro }}>EXPERIMENTAÇÃO</span>
              <span style={{ width: 1, height: 20, background: COR.cinzaBorda, margin: "0 14px" }} />
              <span style={{ fontSize: 15, color: COR.suave }}>CoE Digital</span>
            </div>
            <div style={{ width: 90, height: 3, background: "linear-gradient(90deg, #e2262b, rgba(226,38,43,0))" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, textAlign: "right" }}>
          <span style={{ fontSize: 13, color: COR.suave }}>Os problemas recebidos viram experimentos, com soluções desenvolvidas pelo time InovAI.</span>
          <span style={{ fontSize: 13, color: COR.suave }}>
            Criado por{" "}
            <a
              href={"mailto:" + CONTATO_CRIADOR + "?subject=" + encodeURIComponent("Contato sobre o Prisma de Experimentação")}
              title="Enviar um e-mail para o criador do Prisma"
              style={{ color: COR.vermelhoEscuro, fontWeight: 700 }}
            >
              Cleyton Cunha
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

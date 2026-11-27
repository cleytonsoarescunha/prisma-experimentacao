export default function Home() {
  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 40, fontWeight: 900, color: "var(--vermelho)" }}>
        Prisma de Experimentação
      </h1>
      <p style={{ fontSize: 18, color: "var(--tinta-suave)", maxWidth: 560 }}>
        Projeto preparado. As telas chegam na próxima fatia.
      </p>
    </main>
  );
}

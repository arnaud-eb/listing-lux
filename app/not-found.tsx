import Link from "next/link";

// Root-level fallback for paths that miss the [locale] segment entirely.
// Locale-aware copy lives at app/[locale]/not-found.tsx — this is bare
// because no NextIntlClientProvider is in scope here.
export default function RootNotFound() {
  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8f7f6",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", color: "#0a1128", marginBottom: "1rem" }}>
            Page introuvable
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Cette page n&apos;existe pas.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              background: "#d4af35",
              color: "#0a1128",
              textDecoration: "none",
              borderRadius: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </body>
    </html>
  );
}

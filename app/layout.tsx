import "./globals.css";

// Root layout is a passthrough — html/body/fonts/providers live in app/[locale]/layout.tsx
// so <html lang> can be driven by the active locale. Next.js requires html/body in some
// layout, and next-intl's documented pattern hoists them under the [locale] segment.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

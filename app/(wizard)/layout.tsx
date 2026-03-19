import Link from "next/link";
import Logo from "@/components/shared/Logo";
import StepProgressClient from "@/components/shared/StepProgressClient";

export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-gold/20 px-6 py-4 lg:px-20 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Logo />
        <Link
          href="/"
          className="text-sm font-medium text-gray-500 hover:text-gold transition-colors focus-visible:text-gold outline-none focus-visible:underline underline-offset-4"
        >
          ← Back to Home
        </Link>
      </header>
      <div className="container mx-auto px-6 pt-6 pb-4">
        <StepProgressClient />
      </div>
      <main id="main-content">{children}</main>
    </>
  );
}

import Logo from "@/components/shared/Logo";
import WizardNav from "@/components/shared/WizardNav";
import { getSessionId } from "@/lib/session";

export default async function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionId = await getSessionId();
  const hasSession = !!sessionId;

  return (
    <>
      <header className="flex items-center justify-between border-b border-gold/20 px-6 py-4 lg:px-20 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Logo />
        <WizardNav hasSession={hasSession} />
      </header>
      <main id="main-content">{children}</main>
    </>
  );
}

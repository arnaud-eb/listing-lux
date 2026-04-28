import Hero from "@/components/landing/Hero";
import EfficiencyComparison from "@/components/landing/EfficiencyComparison";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";

export const revalidate = false;

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <main className="flex-1">
        <Hero />
        <EfficiencyComparison />
        <HowItWorks />
        <Pricing />
      </main>
    </div>
  );
}

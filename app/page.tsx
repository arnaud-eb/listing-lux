import Hero from '@/components/landing/Hero'
import EfficiencyComparison from '@/components/landing/EfficiencyComparison'
import HowItWorks from '@/components/landing/HowItWorks'
import Pricing from '@/components/landing/Pricing'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <EfficiencyComparison />
      <HowItWorks />
      <Pricing />
      <Footer />
    </main>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'

const PLANS = [
  {
    name: 'Starter',
    price: '€49',
    period: '/month',
    description: 'For independent agents getting started with AI.',
    features: [
      '20 listings per month',
      'All 4 languages (DE/FR/EN/LU)',
      'Photo upload (up to 5 per listing)',
      'PDF export',
      'Email support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '€199',
    period: '/month',
    description: 'For active agents who list multiple properties weekly.',
    features: [
      'Unlimited listings',
      'All 4 languages (DE/FR/EN/LU)',
      'Photo upload (up to 10 per listing)',
      'AI photo analysis',
      'PDF + portal export (athome.lu)',
      'Priority support',
      'Team sharing (up to 3 agents)',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '€499',
    period: '/month',
    description: 'For agencies with large teams and custom workflows.',
    features: [
      'Everything in Professional',
      'Unlimited team members',
      'API access',
      'Custom branding',
      'White-label export',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export default function Pricing() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl font-bold text-[#1a2332] mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Start free, scale as you grow. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto max-lg:grid-cols-1">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col ${
                plan.highlighted
                  ? 'bg-[#1a2332] text-white shadow-2xl scale-105 max-lg:scale-100'
                  : 'border border-gray-200 bg-white'
              }`}
            >
              <div className="mb-6">
                <div
                  className={`text-sm font-semibold mb-2 ${
                    plan.highlighted ? 'text-[#C5A059]' : 'text-gray-500'
                  }`}
                >
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-bold font-serif ${
                      plan.highlighted ? 'text-white' : 'text-[#1a2332]'
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span className={plan.highlighted ? 'text-white/60' : 'text-gray-400'}>
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`text-sm mt-3 leading-relaxed ${
                    plan.highlighted ? 'text-white/70' : 'text-gray-500'
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <span className="text-[#C5A059] flex-shrink-0 mt-0.5">✓</span>
                    <span className={plan.highlighted ? 'text-white/80' : 'text-gray-600'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={
                  plan.highlighted
                    ? 'bg-[#C5A059] text-white hover:bg-[#C5A059]/90 border-0 w-full'
                    : 'w-full'
                }
                variant={plan.highlighted ? 'default' : 'outline'}
              >
                <Link href="/create">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

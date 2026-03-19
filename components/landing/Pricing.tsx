import Link from "next/link";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    description: "Perfect for independent agents",
    price: "€99",
    period: "/month",
    features: [
      "5 Listings per month",
      "4 Languages (DE, FR, EN, LU)",
      "Standard Photo Analysis",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Professional",
    description: "For high-volume real estate agents",
    price: "€249",
    period: "/month",
    features: [
      "25 Listings per month",
      "Multi-user dashboard",
      "Advanced Architectural Analysis",
      "Social Media Teasers",
    ],
    cta: "Select Elite Plan",
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "For agencies with large teams and custom workflows.",
    price: "Custom",
    period: "",
    features: [
      "Unlimited Listings",
      "Custom Brand Tone Training",
      "API Integration",
      "Dedicated Success Manager",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section className="py-24 px-6 lg:px-20 bg-navy-deep/5" id="pricing">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl font-bold mb-4 text-navy-deep max-md:text-3xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-600">
            Start free, scale as you grow. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 max-md:grid-cols-1">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlighted
                  ? "p-8 rounded-xl border-2 border-gold bg-navy-deep text-white flex flex-col gap-6 relative shadow-2xl scale-105 z-10 max-md:scale-100"
                  : "p-8 rounded-xl border border-slate-200 bg-white flex flex-col gap-6 hover:shadow-lg transition-shadow shadow-sm"
              }
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-navy-deep text-2xs font-black uppercase tracking-widest px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div>
                <h3
                  className={`font-bold text-lg ${plan.highlighted ? "text-white" : "text-navy-deep"}`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm ${plan.highlighted ? "text-slate-400" : "text-slate-500"}`}
                >
                  {plan.description}
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span
                  className={`text-4xl font-bold ${plan.highlighted ? "text-gold" : "text-navy-deep"}`}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span
                    className={
                      plan.highlighted ? "text-slate-400" : "text-slate-500"
                    }
                  >
                    {plan.period}
                  </span>
                )}
              </div>

              <ul className="space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-center gap-2 text-sm ${plan.highlighted ? "text-slate-200" : "text-slate-600"}`}
                  >
                    <Check className="text-gold size-4 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === "Enterprise" ? "#contact" : "/create"}
                className={
                  plan.highlighted
                    ? "w-full py-3 rounded-lg bg-gold text-navy-deep font-bold hover:bg-white transition-colors text-center inline-block focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 outline-none"
                    : "w-full py-3 rounded-lg border border-gold text-gold font-bold hover:bg-gold/5 transition-colors text-center inline-block focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 outline-none"
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

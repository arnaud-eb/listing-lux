import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";

const PLANS = [
  {
    key: "starter",
    href: "/create",
    showPeriod: true,
    highlighted: false,
    features: ["feature1", "feature2", "feature3"] as const,
  },
  {
    key: "professional",
    href: "/create",
    showPeriod: true,
    highlighted: true,
    features: ["feature1", "feature2", "feature3", "feature4"] as const,
  },
  {
    key: "enterprise",
    href: "#contact",
    showPeriod: false,
    highlighted: false,
    features: ["feature1", "feature2", "feature3", "feature4"] as const,
  },
] as const;

export default function Pricing() {
  const t = useTranslations("landing.pricing");

  return (
    <section className="py-24 px-6 lg:px-20 bg-navy-deep/5" id="pricing">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl font-bold mb-4 text-navy-deep max-md:text-3xl">
            {t("title")}
          </h2>
          <p className="text-slate-600">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-3 gap-8 max-md:grid-cols-1">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={
                plan.highlighted
                  ? "p-8 rounded-xl border-2 border-gold bg-navy-deep text-white flex flex-col gap-6 relative shadow-2xl scale-105 z-10 max-md:scale-100"
                  : "p-8 rounded-xl border border-slate-200 bg-white flex flex-col gap-6 hover:shadow-lg transition-shadow shadow-sm"
              }
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-navy-deep text-2xs font-black uppercase tracking-widest px-4 py-1 rounded-full">
                  {t("mostPopular")}
                </div>
              )}

              <div>
                <h3
                  className={`font-bold text-lg ${plan.highlighted ? "text-white" : "text-navy-deep"}`}
                >
                  {t(`${plan.key}.name`)}
                </h3>
                <p
                  className={`text-sm ${plan.highlighted ? "text-slate-400" : "text-slate-500"}`}
                >
                  {t(`${plan.key}.description`)}
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span
                  className={`text-4xl font-bold ${plan.highlighted ? "text-gold" : "text-navy-deep"}`}
                >
                  {t(`${plan.key}.price`)}
                </span>
                {plan.showPeriod && (
                  <span
                    className={
                      plan.highlighted ? "text-slate-400" : "text-slate-500"
                    }
                  >
                    {t("perMonth")}
                  </span>
                )}
              </div>

              <ul className="space-y-3 flex-1">
                {plan.features.map((featureKey) => (
                  <li
                    key={featureKey}
                    className={`flex items-center gap-2 text-sm ${plan.highlighted ? "text-slate-200" : "text-slate-600"}`}
                  >
                    <Check className="text-gold size-4 shrink-0" />
                    {t(`${plan.key}.${featureKey}`)}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={
                  plan.highlighted
                    ? "w-full py-3 rounded-lg bg-gold text-navy-deep font-bold hover:bg-white transition-colors text-center inline-block focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 outline-none"
                    : "w-full py-3 rounded-lg border border-gold text-gold font-bold hover:bg-gold/5 transition-colors text-center inline-block focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 outline-none"
                }
              >
                {t(`${plan.key}.cta`)}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Camera, ClipboardList, Sparkles, type LucideIcon } from "lucide-react";

const STEPS: { number: string; title: string; description: string; icon: LucideIcon }[] = [
  {
    number: "01",
    title: "Upload Images",
    description:
      "Drag and drop up to 10 property photos. Our AI analyzes each image to identify key features automatically.",
    icon: Camera,
  },
  {
    number: "02",
    title: "Key Details",
    description:
      "Enter bedrooms, bathrooms, size, price, and select the neighborhood. Toggle feature chips for what applies.",
    icon: ClipboardList,
  },
  {
    number: "03",
    title: "Generate & Localize",
    description:
      "Click Generate and receive polished listings in German, French, English, and Luxembourgish instantly.",
    icon: Sparkles,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 lg:px-20 bg-bg-light" id="how-it-works">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h2 className="font-serif text-4xl font-bold mb-4 max-md:text-3xl">
          Three Steps to a Perfect Listing
        </h2>
        <p className="text-slate-600">
          From photos to published listing in under 5 minutes
        </p>
      </div>

      <div className="max-w-5xl mx-auto relative">
        {/* Connector line (desktop) */}
        <div
          className="absolute top-1/2 left-0 w-full h-px bg-gold/20 -translate-y-1/2 max-md:hidden"
          aria-hidden="true"
        />

        <div className="grid grid-cols-3 gap-12 relative max-md:grid-cols-1">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="flex flex-col items-center text-center gap-6"
            >
              {/* Icon circle */}
              <div className="relative z-10 w-20 h-20 rounded-full bg-navy-deep flex items-center justify-center border-4 border-white shadow-xl">
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gold text-navy-deep text-2xs font-bold px-2 py-0.5 rounded-full">
                  {step.number}
                </span>
                <step.icon className="text-white size-7" />
              </div>

              <div>
                <p className="text-gold font-bold text-sm mb-2">
                  {step.number}
                </p>
                <h3 className="font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

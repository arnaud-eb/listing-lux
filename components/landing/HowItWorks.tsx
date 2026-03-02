const STEPS = [
  {
    number: '01',
    title: 'Upload Images',
    description: 'Drag and drop up to 10 property photos. Our AI analyzes each image to identify key features automatically.',
    icon: '📸',
  },
  {
    number: '02',
    title: 'Key Details',
    description: 'Enter bedrooms, bathrooms, size, price, and select the neighborhood. Toggle feature chips for what applies.',
    icon: '📋',
  },
  {
    number: '03',
    title: 'Generate & Localize',
    description: 'Click Generate and receive polished listings in German, French, English, and Luxembourgish instantly.',
    icon: '✨',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 bg-[#f6f7f7]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl font-bold text-[#1a2332] mb-4">
            Three Steps to a Perfect Listing
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            From photos to published listing in under 5 minutes
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connector line (desktop) */}
          <div
            className="absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-[#C5A059]/30 max-lg:hidden"
            aria-hidden="true"
          />

          <div className="grid grid-cols-3 gap-8 max-lg:grid-cols-1">
            {STEPS.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center text-center">
                {/* Step number circle */}
                <div className="relative z-10 w-16 h-16 rounded-full bg-[#1a2332] text-white flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#C5A059] flex items-center justify-center -mt-3 max-lg:hidden">
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>

                <span className="text-sm font-bold text-[#C5A059] mb-2">{step.number}</span>
                <h3 className="text-xl font-semibold text-[#1a2332] mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

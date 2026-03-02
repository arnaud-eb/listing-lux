export default function EfficiencyComparison() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl font-bold text-[#1a2332] mb-4">
            Stop Spending Hours on Listings
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            See the difference AI makes for your daily workflow
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 max-w-3xl mx-auto max-lg:grid-cols-1">
          {/* Manual */}
          <div className="rounded-2xl border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-500 text-lg">✎</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Manual Writing</div>
                <div className="text-2xl font-bold text-gray-800">2 Hours</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Time per listing</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-gray-400 h-3 rounded-full w-full" />
              </div>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span> Write 4 language versions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span> Manual SEO keyword research
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span> Inconsistent tone and quality
              </li>
            </ul>
          </div>

          {/* AI */}
          <div className="rounded-2xl border-2 border-[#C5A059] p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="bg-[#C5A059] text-white text-xs font-bold px-3 py-1 rounded-full">
                -96% Time
              </span>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center">
                <span className="text-[#C5A059] text-lg">✦</span>
              </div>
              <div>
                <div className="text-sm font-medium text-[#C5A059]">ListingLux AI</div>
                <div className="text-2xl font-bold text-[#1a2332]">5 Minutes</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Time per listing</span>
                <span>4%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-[#C5A059] h-3 rounded-full" style={{ width: '5%' }} />
              </div>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-[#C5A059]">✓</span> 4 languages generated at once
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#C5A059]">✓</span> SEO keywords included
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#C5A059]">✓</span> Consistent professional tone
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

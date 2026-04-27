export default function ListingLoading() {
  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      <div className="container mx-auto px-6 py-8 flex-1">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-9 w-72 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex items-center gap-4 mt-3">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-14 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Two-column layout — mirrors page.tsx grid + order classes */}
        <div className="grid grid-cols-3 gap-8 max-xl:grid-cols-5 max-lg:grid-cols-1">
          {/* Gallery skeleton — shows first on mobile to match real page.
              Two variants mirror PhotoCarousel: mobile scroll+dots vs desktop hero+thumbs. */}
          <div className="col-span-1 max-xl:col-span-2 max-lg:col-span-full max-lg:order-1">
            {/* Mobile: single hero card + dot indicators below */}
            <div className="lg:hidden">
              <div className="aspect-4/3 bg-gray-200 rounded-xl animate-pulse" />
              <div className="flex justify-center gap-1.5 pt-3 pb-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className={`block rounded-full bg-gray-200 animate-pulse ${
                      i === 0 ? "w-5 h-1.5" : "w-1.5 h-1.5"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop: hero image + thumbnail strip */}
            <div className="hidden lg:flex flex-col gap-3">
              <div className="aspect-4/3 bg-gray-200 rounded-xl animate-pulse" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-16 h-12 bg-gray-200 rounded-md animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="col-span-2 max-xl:col-span-3 max-lg:col-span-full max-lg:order-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              {/* Tab bar */}
              <div className="flex gap-4 mb-6 border-b border-gray-100 pb-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-5 w-16 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
              {/* Content lines */}
              <div className="space-y-3">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mt-4" />
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              </div>

              {/* Bottom bar skeleton — inside card */}
              <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
                <div className="h-9 w-16 max-sm:w-10 bg-gray-200 rounded-lg animate-pulse" />
                <div className="flex gap-3">
                  <div className="h-9 w-10 max-sm:w-9 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-9 w-20 max-sm:w-16 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

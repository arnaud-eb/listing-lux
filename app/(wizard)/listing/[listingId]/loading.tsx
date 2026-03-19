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

        {/* Two-column layout */}
        <div className="grid grid-cols-[1fr_2fr] gap-8 max-lg:grid-cols-1">
          {/* Gallery skeleton */}
          <div className="max-lg:order-2">
            <div className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />
            <div className="flex gap-2 mt-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-16 h-12 bg-gray-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Content skeleton */}
          <div className="max-lg:order-1">
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

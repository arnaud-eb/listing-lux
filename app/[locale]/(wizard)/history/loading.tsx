export default function HistoryLoading() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="h-9 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Thumbnail skeleton */}
            <div className="aspect-16/10 bg-gray-200 animate-pulse" />

            {/* Card body skeleton */}
            <div className="p-4">
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />

              <div className="flex items-center gap-3 mt-3">
                <div className="h-3.5 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-3.5 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-3.5 w-14 bg-gray-200 rounded animate-pulse" />
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

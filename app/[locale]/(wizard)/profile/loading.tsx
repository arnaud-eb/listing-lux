export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-bg-light">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-8">
          <div className="h-9 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="h-6 w-52 bg-gray-200 rounded mb-6 animate-pulse" />
          <div className="flex flex-col gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

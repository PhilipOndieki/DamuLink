export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-16 bg-white border-b border-gray-200 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse"
            />
          ))}
        </div>
        <div className="h-80 bg-white rounded-xl border border-gray-200 animate-pulse" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
          <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

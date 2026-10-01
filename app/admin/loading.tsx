export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-16 bg-white border-b border-gray-200 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

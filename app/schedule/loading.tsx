export default function ScheduleLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-16 bg-white border-b border-gray-200 animate-pulse" />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="h-80 bg-white rounded-xl border border-gray-200 animate-pulse" />
          <div className="md:col-span-2 h-80 bg-white rounded-xl border border-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

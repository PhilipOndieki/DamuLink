"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Admin Error</h2>
        <p className="text-gray-500 text-sm mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="bg-brand-red text-white px-6 py-2 rounded-lg text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

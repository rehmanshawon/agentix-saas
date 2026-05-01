export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">
          Loading dashboard...
        </p>
      </div>
    </div>
  );
}

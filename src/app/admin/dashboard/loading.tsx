export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-mw-green border-t-transparent animate-spin" />
        <p className="text-sm text-stone-500">Dashboard wird geladen...</p>
      </div>
    </div>
  );
}

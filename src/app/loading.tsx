export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-mw-green border-t-transparent animate-spin" />
        <p className="text-sm text-stone-500">Laden...</p>
      </div>
    </div>
  );
}

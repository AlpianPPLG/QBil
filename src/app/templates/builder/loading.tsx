export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-12">
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl p-6">
        <div className="text-xl font-black">Loading builder…</div>
        <div className="text-sm text-muted-foreground mt-2">Preparing templates and canvas.</div>
      </div>
    </div>
  );
}


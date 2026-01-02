"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-12">
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl p-6 space-y-3">
        <div className="text-xl font-black">Template builder crashed</div>
        <div className="text-sm text-muted-foreground">
          {error.message || "Unknown error"}
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-primary text-primary-foreground font-bold"
          onClick={reset}
        >
          Retry
        </button>
      </div>
    </div>
  );
}


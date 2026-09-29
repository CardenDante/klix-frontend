'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-muted">Please try again. If it keeps happening, contact support@chach-a.com.</p>
      <button onClick={reset} className="mt-6 rounded-full bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600">
        Try again
      </button>
    </div>
  );
}

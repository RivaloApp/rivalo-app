"use client";

export default function FullScreenLoader() {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(217,70,239,.14),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_55%,#020617_100%)]" />

      <div className="relative z-10 text-center">
        <div className="text-[42px] font-black uppercase leading-none tracking-[-0.04em] text-white drop-shadow-[0_0_22px_rgba(34,211,238,.22)] sm:text-6xl">
          Rivalo
        </div>

        <div className="mt-3 text-xs font-black uppercase tracking-[0.38em] text-cyan-300 sm:text-sm">
          Own the game
        </div>

        <div className="mx-auto mt-7 h-1.5 w-44 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.7)]" />
        </div>
      </div>
    </main>
  );
}

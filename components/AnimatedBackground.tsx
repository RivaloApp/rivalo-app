"use client";

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(217,70,239,.18),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_100%)]" />

      <div className="absolute left-[10%] top-[20%] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl animate-pulse" />
      <div className="absolute right-[10%] top-[10%] h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-[10%] left-[30%] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
    </div>
  );
}

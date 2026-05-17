"use client";

export default function GlowCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#071120]/80 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(34,211,238,.18)]">
      <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,.18),transparent_30%)]" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

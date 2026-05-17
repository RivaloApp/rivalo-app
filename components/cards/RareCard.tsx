"use client";

export default function RareCard(props: any) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/40 bg-gradient-to-br from-[#07111f] via-[#0d1b34] to-[#111827] p-5 shadow-[0_0_40px_rgba(0,255,255,0.15)]">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,255,0.18),transparent_60%)]" />

      <div className="relative z-10">

        <div className="flex items-center justify-between">
          <div className="text-cyan-300 text-sm font-black uppercase">
            Rare
          </div>

          <div className="text-5xl font-black text-cyan-200">
            {props.score}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border border-cyan-300/30 bg-black/30 text-5xl">
            ⚽
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-3xl font-black uppercase text-white">
            {props.name}
          </div>

          <div className="text-cyan-300 uppercase">
            {props.role}
          </div>
        </div>

      </div>
    </div>
  );
}
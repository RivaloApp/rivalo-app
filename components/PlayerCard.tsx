type PlayerCardProps = {
  name: string;
  role: string;
  score: number;
  badge: string;
};

export function PlayerCard({ name, role, score, badge }: PlayerCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 p-5 shadow-2xl">
      <div className="absolute right-[-30px] top-[-30px] h-32 w-32 rounded-full bg-sky-400/20 blur-2xl" />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
            Rivalo Card
          </span>
          <span className="text-3xl">{badge}</span>
        </div>
        <div className="text-5xl font-black text-sky-300">{score}</div>
        <div className="mt-4 text-2xl font-black">{name}</div>
        <div className="mt-1 text-sm text-slate-300">{role}</div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-2xl bg-white/10 p-3">
            <div className="font-black">82</div>
            <div className="text-slate-400">WIN</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <div className="font-black">71</div>
            <div className="text-slate-400">MVP</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <div className="font-black">89</div>
            <div className="text-slate-400">CHEM</div>
          </div>
        </div>
      </div>
    </div>
  );
}

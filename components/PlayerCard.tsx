import { UserRound } from "lucide-react";

export default function PlayerCard({
  name,
  nickname,
  rivalScore,
  mainSport,
  photo,
}: {
  name: string;
  nickname: string;
  rivalScore: number;
  mainSport: string;
  photo: string;
}) {
  const safeRivalScore = Number(rivalScore || 1000);

  const rating = Math.max(
    60,
    Math.min(
      99,
      Math.round(65 + Math.max(0, safeRivalScore - 1000) / 45)
    )
  );

  const displayPhoto = photo || "";

  const rarity =
    rating >= 96
      ? "legend"
      : rating >= 88
      ? "elite"
      : rating >= 80
      ? "rare"
      : "common";

  const rarityLabel =
    rarity === "legend"
      ? "LEGEND"
      : rarity === "elite"
      ? "ELITE"
      : rarity === "rare"
      ? "RARE"
      : "COMMON";

  const stats = [
    {
      label: "VEL",
      value: Math.max(55, Math.min(99, rating + 3)),
    },
    {
      label: "TEC",
      value: Math.max(55, Math.min(99, rating + 1)),
    },
    {
      label: "PAS",
      value: Math.max(55, Math.min(99, rating + 2)),
    },
    {
      label: "FIS",
      value: Math.max(55, Math.min(99, rating - 1)),
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[258px] sm:max-w-[330px]">
      {/* Effetti 3D dietro la card: separati dalla card, senza box rettangolare */}
      <div className="pointer-events-none absolute -left-16 top-10 h-72 w-28 rotate-[-16deg] rounded-full border-l-2 border-cyan-300/35 opacity-80 blur-[1px] sm:-left-20 sm:top-20 sm:h-96 sm:w-36" />
      <div className="pointer-events-none absolute -right-16 top-12 h-72 w-28 rotate-[16deg] rounded-full border-r-2 border-fuchsia-400/35 opacity-80 blur-[1px] sm:-right-20 sm:top-24 sm:h-96 sm:w-36" />
      <div className="pointer-events-none absolute -left-12 bottom-12 h-24 w-40 rounded-full border-b-2 border-yellow-300/35 opacity-80 blur-[1px] sm:-left-16 sm:bottom-20 sm:w-52" />
      <div className="pointer-events-none absolute -right-12 bottom-12 h-24 w-40 rounded-full border-b-2 border-cyan-300/30 opacity-80 blur-[1px] sm:-right-16 sm:bottom-20 sm:w-52" />

      <div className="pointer-events-none absolute -left-14 top-20 h-72 w-28 rounded-full bg-cyan-400/12 blur-3xl sm:-left-20 sm:top-28 sm:h-96 sm:w-36" />
      <div className="pointer-events-none absolute -right-14 top-24 h-72 w-28 rounded-full bg-fuchsia-500/12 blur-3xl sm:-right-20 sm:top-32 sm:h-96 sm:w-36" />
      <div className="pointer-events-none absolute inset-x-8 bottom-[-14px] h-24 rounded-full bg-yellow-300/12 blur-3xl sm:bottom-[-20px]" />

      {/* Glow sagomato sulla forma della card. Niente shadow sul wrapper, quindi niente rettangolo. */}
      <div
        className="pointer-events-none absolute -inset-3 bg-[radial-gradient(circle_at_10%_50%,rgba(249,115,22,.45),transparent_34%),radial-gradient(circle_at_88%_43%,rgba(124,58,237,.45),transparent_38%)] blur-2xl sm:-inset-5 sm:bg-[radial-gradient(circle_at_10%_50%,rgba(249,115,22,.62),transparent_34%),radial-gradient(circle_at_88%_43%,rgba(124,58,237,.58),transparent_38%)]"
        style={{
          clipPath:
            "polygon(9% 0%, 91% 0%, 100% 9%, 100% 81%, 50% 100%, 0% 81%, 0% 9%)",
        }}
      />

      <div className="relative">
        <div
          className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-orange-500 to-purple-500 shadow-[0_0_30px_rgba(249,115,22,.28),0_0_38px_rgba(124,58,237,.24)] sm:shadow-[0_0_38px_rgba(249,115,22,.32),0_0_48px_rgba(124,58,237,.28)]"
          style={{
            clipPath:
              "polygon(9% 0%, 91% 0%, 100% 9%, 100% 81%, 50% 100%, 0% 81%, 0% 9%)",
          }}
        />

        <div
          className="relative m-[2px] overflow-hidden"
          style={{
            clipPath:
              "polygon(10% 1%, 90% 1%, 98.5% 10%, 98.5% 79.5%, 50% 98.5%, 1.5% 79.5%, 1.5% 10%)",
          }}
        >
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_14%_48%,rgba(249,115,22,.48),transparent_33%),radial-gradient(circle_at_84%_42%,rgba(37,99,235,.48),transparent_34%),linear-gradient(135deg,#050814_0%,#070a16_44%,#12051c_100%)]"
            style={{
              clipPath:
                "polygon(10% 1%, 90% 1%, 98.5% 10%, 98.5% 79.5%, 50% 98.5%, 1.5% 79.5%, 1.5% 10%)",
            }}
          />

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,.055)_42%,transparent_54%)]" />
          <div className="pointer-events-none absolute left-[-40%] top-[-20%] h-[160%] w-[70%] rotate-12 bg-cyan-300/[.035] blur-xl" />
          <div className="pointer-events-none absolute right-[-36%] top-[10%] h-[130%] w-[70%] rotate-[-10deg] bg-fuchsia-400/[.04] blur-xl" />

          <div className="relative z-10 flex h-[355px] flex-col px-4 pb-6 pt-4 sm:h-[455px] sm:px-5 sm:pb-7 sm:pt-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl font-black leading-none text-yellow-300 sm:text-5xl">
                  {rating}
                </div>

                <div className="mt-0.5 text-sm font-black uppercase text-yellow-200 sm:mt-1 sm:text-lg">
                  RIV
                </div>
              </div>

              <div className="relative z-20 rounded-xl border border-cyan-300/50 bg-black/60 px-2.5 py-1.5 text-center text-[9px] font-black uppercase tracking-[.12em] text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.38)] sm:rounded-2xl sm:px-3 sm:py-2 sm:text-[11px] sm:tracking-[.14em] sm:shadow-[0_0_18px_rgba(34,211,238,0.45)]">
                {rarityLabel}
              </div>
            </div>

            <div className="relative mt-1 flex h-[92px] items-center justify-center sm:mt-3 sm:h-[140px]">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="Foto profilo"
                  className="relative z-10 h-[88px] w-[88px] rounded-[1rem] object-cover shadow-[0_0_18px_rgba(255,255,255,.10)] sm:h-[132px] sm:w-[132px] sm:rounded-[1.25rem] sm:shadow-[0_0_22px_rgba(255,255,255,.12)]"
                />
              ) : (
                <div className="relative z-10 flex h-[88px] w-[88px] items-center justify-center rounded-[1rem] border border-cyan-300/20 bg-black/25 sm:h-[132px] sm:w-[132px] sm:rounded-[1.25rem]">
                  <UserRound size={48} className="text-cyan-200 sm:hidden" />
                  <UserRound size={70} className="hidden text-cyan-200 sm:block" />
                </div>
              )}
            </div>

            <div className="mt-0 text-center">
              <div className="truncate px-2 text-[22px] font-black uppercase leading-tight text-yellow-300 sm:px-3 sm:text-3xl">
                {name || "Player"}
              </div>

              <div className="mt-0.5 truncate px-2 text-[13px] font-black uppercase leading-tight text-yellow-200 sm:mt-1 sm:px-3 sm:text-lg">
                {nickname || mainSport || "Rivalo Player"}
              </div>
            </div>

            <div className="mt-auto pb-10 pt-2 sm:pb-14 sm:pt-3">
              <div className="grid grid-cols-4 gap-1.5 text-center sm:gap-2">
                {stats.map((stat) => (
                  <CardStat
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardStat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-yellow-300/10 bg-black/35 px-0.5 py-1.5 shadow-[0_0_14px_rgba(0,0,0,.24)]">
      <div className="text-[13px] font-black leading-none text-yellow-300 sm:text-[15px]">
        {value}
      </div>

      <div className="mt-1 text-[7px] font-black uppercase text-yellow-200 sm:text-[8px]">
        {label}
      </div>
    </div>
  );
}

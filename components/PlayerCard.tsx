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
    Math.round(
      65 + Math.max(0, safeRivalScore - 1000) / 45
    )
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

  const rarityStyle =
    rarity === "legend"
      ? "shadow-[0_0_90px_rgba(255,170,0,0.45)] scale-[1.04] saturate-[1.25]"
      : rarity === "elite"
      ? "shadow-[0_0_80px_rgba(0,255,255,0.38)] scale-[1.025] saturate-[1.18]"
      : rarity === "rare"
      ? "shadow-[0_0_65px_rgba(255,120,0,0.32)] scale-[1.015] saturate-[1.12]"
      : "shadow-[0_0_35px_rgba(120,180,255,0.18)]";

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
    <div
      className={`relative mx-auto w-full max-w-[330px] rivalo-card-glow ${rarityStyle}`}
    >
      <div className="absolute -inset-4 rounded-[2.5rem] bg-[radial-gradient(circle_at_10%_50%,rgba(249,115,22,.62),transparent_34%),radial-gradient(circle_at_88%_43%,rgba(124,58,237,.58),transparent_38%)] blur-2xl" />

      <div className="relative">
        <div
          className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-orange-500 to-purple-500 shadow-[0_0_38px_rgba(249,115,22,.32),0_0_48px_rgba(124,58,237,.28)]"
          style={{
            clipPath:
              "polygon(9% 0%, 91% 0%, 100% 9%, 100% 81%, 50% 100%, 0% 81%, 0% 9%)",
          }}
        />

        <div
          className="rivalo-energy-sweep relative m-[2px] overflow-hidden bg-[#050814]"
          style={{
            clipPath:
              "polygon(10% 1%, 90% 1%, 98.5% 10%, 98.5% 79.5%, 50% 98.5%, 1.5% 79.5%, 1.5% 10%)",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_48%,rgba(249,115,22,.48),transparent_33%),radial-gradient(circle_at_84%_42%,rgba(37,99,235,.48),transparent_34%),linear-gradient(135deg,#050814_0%,#070a16_44%,#12051c_100%)]" />

          <div className="relative z-10 flex h-[455px] flex-col px-5 pb-7 pt-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-5xl font-black leading-none text-yellow-300">
                  {rating}
                </div>

                <div className="mt-1 text-lg font-black uppercase text-yellow-200">
                  RIV
                </div>
              </div>

              <div className="relative z-20 rounded-2xl border border-cyan-300/50 bg-black/60 px-3 py-2 text-center text-[11px] font-black uppercase tracking-[.14em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.45)]">
                {rarityLabel}
              </div>
            </div>

            <div className="relative mt-3 flex h-[140px] items-center justify-center">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="Foto profilo"
                  className="relative z-10 h-[132px] w-[132px] rounded-[1.25rem] object-cover shadow-[0_0_22px_rgba(255,255,255,.12)]"
                />
              ) : (
                <div className="relative z-10 flex h-[132px] w-[132px] items-center justify-center rounded-[1.25rem] border border-cyan-300/20 bg-black/25">
                  <UserRound
                    size={70}
                    className="text-cyan-200"
                  />
                </div>
              )}
            </div>

            <div className="mt-1 text-center">
              <div className="truncate px-3 text-3xl font-black uppercase text-yellow-300">
                {name || "Player"}
              </div>

              <div className="mt-1 truncate px-3 text-lg font-black uppercase text-yellow-200">
                {nickname || mainSport || "Rivalo Player"}
              </div>

              <div className="mt-2 text-lg text-yellow-300">
                ★
              </div>
            </div>

            <div className="mt-auto pt-3">
              <div className="grid grid-cols-4 gap-2 text-center">
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
    <div className="min-w-0 rounded-md bg-black/20 px-0.5 py-1">
      <div className="text-[15px] font-black leading-none text-yellow-300">
        {value}
      </div>

      <div className="mt-1 text-[8px] font-black uppercase text-yellow-200">
        {label}
      </div>
    </div>
  );
}
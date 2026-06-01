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

  const rarityStyle =
    rarity === "legend"
      ? "shadow-[0_0_90px_rgba(255,170,0,0.45)] sm:scale-[1.04] saturate-[1.25]"
      : rarity === "elite"
      ? "shadow-[0_0_80px_rgba(0,255,255,0.38)] sm:scale-[1.025] saturate-[1.18]"
      : rarity === "rare"
      ? "shadow-[0_0_65px_rgba(255,120,0,0.32)] sm:scale-[1.015] saturate-[1.12]"
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
      className={`relative mx-auto w-full max-w-[255px] sm:max-w-[330px] rivalo-card-glow ${rarityStyle}`}
    >
      <div className="absolute -inset-3 rounded-[2rem] bg-[radial-gradient(circle_at_10%_50%,rgba(249,115,22,.48),transparent_34%),radial-gradient(circle_at_88%_43%,rgba(124,58,237,.46),transparent_38%)] blur-2xl sm:-inset-4 sm:rounded-[2.5rem] sm:bg-[radial-gradient(circle_at_10%_50%,rgba(249,115,22,.62),transparent_34%),radial-gradient(circle_at_88%_43%,rgba(124,58,237,.58),transparent_38%)]" />

      <div className="relative">
        <div
          className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-orange-500 to-purple-500 shadow-[0_0_30px_rgba(249,115,22,.28),0_0_38px_rgba(124,58,237,.24)] sm:shadow-[0_0_38px_rgba(249,115,22,.32),0_0_48px_rgba(124,58,237,.28)]"
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

          <div className="relative z-10 flex h-[350px] flex-col px-4 pb-5 pt-4 sm:h-[455px] sm:px-5 sm:pb-7 sm:pt-5">
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

            <div className="relative mt-2 flex h-[108px] items-center justify-center sm:mt-3 sm:h-[140px]">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="Foto profilo"
                  className="relative z-10 h-[98px] w-[98px] rounded-[1rem] object-cover shadow-[0_0_18px_rgba(255,255,255,.10)] sm:h-[132px] sm:w-[132px] sm:rounded-[1.25rem] sm:shadow-[0_0_22px_rgba(255,255,255,.12)]"
                />
              ) : (
                <div className="relative z-10 flex h-[98px] w-[98px] items-center justify-center rounded-[1rem] border border-cyan-300/20 bg-black/25 sm:h-[132px] sm:w-[132px] sm:rounded-[1.25rem]">
                  <UserRound size={52} className="text-cyan-200 sm:hidden" />
                  <UserRound size={70} className="hidden text-cyan-200 sm:block" />
                </div>
              )}
            </div>

            <div className="mt-0 text-center sm:mt-1">
              <div className="truncate px-2 text-2xl font-black uppercase text-yellow-300 sm:px-3 sm:text-3xl">
                {name || "Player"}
              </div>

              <div className="mt-0.5 truncate px-2 text-sm font-black uppercase text-yellow-200 sm:mt-1 sm:px-3 sm:text-lg">
                {nickname || mainSport || "Rivalo Player"}
              </div>

              <div className="mt-1 text-base text-yellow-300 sm:mt-2 sm:text-lg">
                ★
              </div>
            </div>

            <div className="mt-auto pt-2 sm:pt-3">
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
    <div className="min-w-0 rounded-md bg-black/20 px-0.5 py-1">
      <div className="text-[13px] font-black leading-none text-yellow-300 sm:text-[15px]">
        {value}
      </div>

      <div className="mt-1 text-[7px] font-black uppercase text-yellow-200 sm:text-[8px]">
        {label}
      </div>
    </div>
  );
}

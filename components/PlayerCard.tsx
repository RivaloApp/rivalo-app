import { UserRound } from "lucide-react";

type PlayerCardProps = {
  name: string;
  nickname: string;
  rivalScore: number;
  mainSport: string;
  photo: string;
  level?: number;
  xp?: number;
  wins?: number;
  mvp?: number;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
  winStreak?: number;
  role?: string;
  goalsConceded?: number;
  cleanSheets?: number;
  penaltiesSaved?: number;
};

function normalizeSport(value?: string) {
  const sport = (value || "").toLowerCase().trim();

  if (sport === "padel") return "padel";
  if (sport === "tennis") return "tennis";

  return "calcetto";
}

function clampStat(value: number) {
  return Math.max(55, Math.min(99, Math.round(value)));
}

function sportLabel(value?: string) {
  const sport = normalizeSport(value);

  if (sport === "padel") return "PADEL";
  if (sport === "tennis") return "TENNIS";

  return "CALCETTO";
}

function normalizeCalcettoRole(value?: string) {
  const role = (value || "").toLowerCase().trim();

  if (role.includes("port")) return "portiere";
  if (role.includes("dif")) return "difensore";
  if (role.includes("cent")) return "centrocampista";
  if (role.includes("att")) return "attaccante";
  if (role.includes("jolly")) return "jolly";

  return role;
}

function calcettoRoleCardLabel(value?: string) {
  const role = normalizeCalcettoRole(value);

  if (role === "portiere") return "GOALKEEPER";
  if (role === "difensore") return "DEFENDER";
  if (role === "centrocampista") return "MIDFIELD";
  if (role === "attaccante") return "STRIKER";
  if (role === "jolly") return "UTILITY";

  return "PLAYER CARD";
}

function getSportPositionLabel(value?: string, role?: string) {
  const sport = normalizeSport(value);

  if (sport === "padel") return "CONTROL PAIR";
  if (sport === "tennis") return "BASELINE PRO";

  return calcettoRoleCardLabel(role);
}

function SportCardIcon({ mainSport }: { mainSport: string }) {
  const sport = normalizeSport(mainSport);

  if (sport === "padel") {
    return (
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M24 7c9-6 23 2 26 14 3 13-4 25-15 28-11 3-24-5-26-18C7 21 14 12 24 7Z"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M24 7c7 8 11 24 11 42"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".75"
        />
        <path
          d="M10 30c10-3 28-2 40 4"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".75"
        />
        <circle cx="24" cy="23" r="2" fill="currentColor" />
        <circle cx="33" cy="22" r="2" fill="currentColor" />
        <circle cx="41" cy="27" r="2" fill="currentColor" />
        <circle cx="20" cy="32" r="2" fill="currentColor" />
        <circle cx="30" cy="34" r="2" fill="currentColor" />
        <circle cx="39" cy="38" r="2" fill="currentColor" />
        <path
          d="M35 49 27 59"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (sport === "tennis") {
    return (
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="32"
          cy="32"
          r="24"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          d="M13 25c10 4 15 13 14 31"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M51 39c-10-4-15-13-14-31"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className="h-full w-full"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="24"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M32 18 44 27l-5 15H25l-5-15 12-9Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M20 27 12 24M44 27l8-3M25 42l-5 10M39 42l5 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getCardBottomStats({
  mainSport,
  wins,
  matchesPlayed,
  goals,
  assists,
  mvp,
  winStreak,
  role,
  goalsConceded,
  cleanSheets,
  penaltiesSaved,
}: {
  mainSport: string;
  wins: number;
  matchesPlayed: number;
  goals: number;
  assists: number;
  mvp: number;
  winStreak: number;
  role: string;
  goalsConceded: number;
  cleanSheets: number;
  penaltiesSaved: number;
}) {
  const sport = normalizeSport(mainSport);
  const winRate =
    matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  if (sport === "padel") {
    return [
      { label: "WIN", value: wins },
      { label: "WR%", value: winRate },
      { label: "STR", value: winStreak },
    ];
  }

  if (sport === "tennis") {
    return [
      { label: "WIN", value: wins },
      { label: "WR%", value: winRate },
      { label: "MVP", value: mvp },
    ];
  }

  if (normalizeCalcettoRole(role) === "portiere") {
    return [
      { label: "GS", value: goalsConceded },
      { label: "CS", value: cleanSheets },
      { label: "RP", value: penaltiesSaved },
    ];
  }

  return [
    { label: "GOL", value: goals },
    { label: "AST", value: assists },
    { label: "MVP", value: mvp },
  ];
}

function getSportTheme(mainSport: string) {
  const sport = normalizeSport(mainSport);

  if (sport === "padel") {
    return {
      glowLeft: "border-lime-300/35",
      glowRight: "border-cyan-400/35",
      glowBottomA: "border-lime-300/35",
      glowBottomB: "border-cyan-300/30",
      auraLeft: "bg-lime-400/12",
      auraRight: "bg-cyan-500/12",
      auraBottom: "bg-lime-300/12",
      outerGlow:
        "bg-[radial-gradient(circle_at_10%_50%,rgba(132,204,22,.52),transparent_34%),radial-gradient(circle_at_88%_43%,rgba(34,211,238,.45),transparent_38%)] sm:bg-[radial-gradient(circle_at_10%_50%,rgba(132,204,22,.66),transparent_34%),radial-gradient(circle_at_88%_43%,rgba(34,211,238,.58),transparent_38%)]",
      borderGradient: "bg-gradient-to-br from-lime-300 via-cyan-400 to-emerald-700",
      innerGradient:
        "bg-[radial-gradient(circle_at_14%_48%,rgba(132,204,22,.45),transparent_33%),radial-gradient(circle_at_84%_42%,rgba(34,211,238,.42),transparent_34%),linear-gradient(135deg,#04130b_0%,#071426_44%,#031711_100%)]",
      ratingText: "text-lime-300",
      softText: "text-lime-200",
      badgeBorder: "border-lime-300/50",
      badgeText: "text-lime-100",
      badgeShadow: "shadow-[0_0_14px_rgba(132,204,22,0.38)] sm:shadow-[0_0_18px_rgba(132,204,22,0.45)]",
      statBorder: "border-lime-300/10",
      statText: "text-lime-300",
      statLabel: "text-lime-200",
    };
  }

  if (sport === "tennis") {
    return {
      glowLeft: "border-yellow-300/35",
      glowRight: "border-cyan-400/35",
      glowBottomA: "border-yellow-300/35",
      glowBottomB: "border-cyan-300/30",
      auraLeft: "bg-yellow-400/12",
      auraRight: "bg-cyan-500/12",
      auraBottom: "bg-yellow-300/12",
      outerGlow:
        "bg-[radial-gradient(circle_at_10%_50%,rgba(250,204,21,.50),transparent_34%),radial-gradient(circle_at_88%_43%,rgba(34,211,238,.42),transparent_38%)] sm:bg-[radial-gradient(circle_at_10%_50%,rgba(250,204,21,.62),transparent_34%),radial-gradient(circle_at_88%_43%,rgba(34,211,238,.54),transparent_38%)]",
      borderGradient: "bg-gradient-to-br from-yellow-200 via-cyan-300 to-blue-700",
      innerGradient:
        "bg-[radial-gradient(circle_at_14%_48%,rgba(250,204,21,.42),transparent_33%),radial-gradient(circle_at_84%_42%,rgba(34,211,238,.42),transparent_34%),linear-gradient(135deg,#141006_0%,#071426_44%,#03101a_100%)]",
      ratingText: "text-yellow-200",
      softText: "text-yellow-100",
      badgeBorder: "border-yellow-300/50",
      badgeText: "text-yellow-100",
      badgeShadow: "shadow-[0_0_14px_rgba(250,204,21,0.36)] sm:shadow-[0_0_18px_rgba(250,204,21,0.42)]",
      statBorder: "border-yellow-300/10",
      statText: "text-yellow-200",
      statLabel: "text-yellow-100",
    };
  }

  return {
    glowLeft: "border-cyan-300/35",
    glowRight: "border-fuchsia-400/35",
    glowBottomA: "border-yellow-300/35",
    glowBottomB: "border-cyan-300/30",
    auraLeft: "bg-cyan-400/12",
    auraRight: "bg-fuchsia-500/12",
    auraBottom: "bg-yellow-300/12",
    outerGlow:
      "bg-[radial-gradient(circle_at_10%_50%,rgba(249,115,22,.45),transparent_34%),radial-gradient(circle_at_88%_43%,rgba(124,58,237,.45),transparent_38%)] sm:bg-[radial-gradient(circle_at_10%_50%,rgba(249,115,22,.62),transparent_34%),radial-gradient(circle_at_88%_43%,rgba(124,58,237,.58),transparent_38%)]",
    borderGradient: "bg-gradient-to-br from-yellow-300 via-orange-500 to-purple-500",
    innerGradient:
      "bg-[radial-gradient(circle_at_14%_48%,rgba(249,115,22,.48),transparent_33%),radial-gradient(circle_at_84%_42%,rgba(37,99,235,.48),transparent_34%),linear-gradient(135deg,#050814_0%,#070a16_44%,#12051c_100%)]",
    ratingText: "text-yellow-300",
    softText: "text-yellow-200",
    badgeBorder: "border-cyan-300/50",
    badgeText: "text-cyan-100",
    badgeShadow: "shadow-[0_0_14px_rgba(34,211,238,0.38)] sm:shadow-[0_0_18px_rgba(34,211,238,0.45)]",
    statBorder: "border-yellow-300/10",
    statText: "text-yellow-300",
    statLabel: "text-yellow-200",
  };
}

function getSportStats({
  mainSport,
  rating,
  wins = 0,
  mvp = 0,
  matchesPlayed = 0,
  goals = 0,
  assists = 0,
  winStreak = 0,
  role = "",
  goalsConceded = 0,
  cleanSheets = 0,
  penaltiesSaved = 0,
  level = 1,
  xp = 0,
}: {
  mainSport: string;
  rating: number;
  wins?: number;
  mvp?: number;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
  winStreak?: number;
  role?: string;
  goalsConceded?: number;
  cleanSheets?: number;
  penaltiesSaved?: number;
  level?: number;
  xp?: number;
}) {
  const sport = normalizeSport(mainSport);
  const activityBoost = Math.min(8, matchesPlayed * 0.6);
  const winBoost = Math.min(9, wins * 1.1);
  const mvpBoost = Math.min(7, mvp * 1.4);
  const xpBoost = Math.min(6, xp / 500);
  const levelBoost = Math.min(5, level * 0.6);
  const streakBoost = Math.min(6, winStreak * 0.8);

  if (sport === "padel") {
    return [
      { label: "VOL", value: clampStat(rating + mvpBoost + 2) },
      { label: "DIF", value: clampStat(rating + activityBoost - 1) },
      { label: "POT", value: clampStat(rating + winBoost - 2) },
      { label: "INT", value: clampStat(rating + mvpBoost + levelBoost) },
      { label: "RES", value: clampStat(rating + activityBoost + xpBoost - 2) },
      { label: "POS", value: clampStat(rating + winBoost + streakBoost) },
    ];
  }

  if (sport === "tennis") {
    return [
      { label: "SRV", value: clampStat(rating + winBoost + 1) },
      { label: "FON", value: clampStat(rating + activityBoost) },
      { label: "MOV", value: clampStat(rating + xpBoost + 1) },
      { label: "MEN", value: clampStat(rating + mvpBoost + levelBoost + streakBoost) },
      { label: "POT", value: clampStat(rating + winBoost - 1) },
      { label: "DIF", value: clampStat(rating + activityBoost - 1) },
    ];
  }

  if (normalizeCalcettoRole(role) === "portiere") {
    const cleanSheetBoost = Math.min(8, cleanSheets * 1.6);
    const penaltyBoost = Math.min(7, penaltiesSaved * 2);
    const concededPenalty = Math.min(6, goalsConceded * 0.15);

    return [
      { label: "RIF", value: clampStat(rating + activityBoost + 2) },
      { label: "PRE", value: clampStat(rating + cleanSheetBoost + 1) },
      { label: "POS", value: clampStat(rating + winBoost + levelBoost) },
      { label: "LAN", value: clampStat(rating + xpBoost + 1) },
      { label: "RIG", value: clampStat(rating + penaltyBoost) },
      { label: "TEN", value: clampStat(rating + cleanSheetBoost - concededPenalty) },
    ];
  }

  return [
    { label: "VEL", value: clampStat(rating + 3 + activityBoost * 0.2) },
    { label: "TEC", value: clampStat(rating + 1 + Math.min(7, goals * 0.35)) },
    { label: "PAS", value: clampStat(rating + 2 + Math.min(7, assists * 0.5)) },
    { label: "FIS", value: clampStat(rating - 1 + activityBoost * 0.3) },
    { label: "FIN", value: clampStat(rating + Math.min(8, goals * 0.45)) },
    { label: "DEF", value: clampStat(rating + winBoost - 2) },
  ];
}

export default function PlayerCard({
  name,
  nickname,
  rivalScore,
  mainSport,
  photo,
  level = 1,
  xp = 0,
  wins = 0,
  mvp = 0,
  matchesPlayed = 0,
  goals = 0,
  assists = 0,
  winStreak = 0,
  role = "",
  goalsConceded = 0,
  cleanSheets = 0,
  penaltiesSaved = 0,
}: PlayerCardProps) {
  const safeRivalScore = Number(rivalScore || 1000);

  const rating = Math.max(
    60,
    Math.min(
      99,
      Math.round(65 + Math.max(0, safeRivalScore - 1000) / 45)
    )
  );

  const displayPhoto = photo || "";
  const theme = getSportTheme(mainSport);

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

  const stats = getSportStats({
    mainSport,
    rating,
    wins,
    mvp,
    matchesPlayed,
    goals,
    assists,
    winStreak,
    role,
    goalsConceded,
    cleanSheets,
    penaltiesSaved,
    level,
    xp,
  });

  const bottomStats = getCardBottomStats({
    mainSport,
    wins,
    matchesPlayed,
    goals,
    assists,
    mvp,
    winStreak,
    role,
    goalsConceded,
    cleanSheets,
    penaltiesSaved,
  });

  const displayCardName = (name || "Player").trim();
  const displayCardSubtitle = (nickname || sportLabel(mainSport) || "Rivalo Player").trim();
  const cardNameLength = displayCardName.length;

  const cardNameClass =
    cardNameLength > 22
      ? "text-[14px] sm:text-[20px]"
      : cardNameLength > 18
      ? "text-[16px] sm:text-[22px]"
      : cardNameLength > 13
      ? "text-[18px] sm:text-[25px]"
      : "text-[21px] sm:text-3xl";
  return (
    <div className="relative mx-auto w-full max-w-[258px] sm:max-w-[330px]">
      <div className={`pointer-events-none absolute -left-16 top-10 h-72 w-28 rotate-[-16deg] rounded-full border-l-2 ${theme.glowLeft} opacity-80 blur-[1px] sm:-left-20 sm:top-20 sm:h-96 sm:w-36`} />
      <div className={`pointer-events-none absolute -right-16 top-12 h-72 w-28 rotate-[16deg] rounded-full border-r-2 ${theme.glowRight} opacity-80 blur-[1px] sm:-right-20 sm:top-24 sm:h-96 sm:w-36`} />
      <div className={`pointer-events-none absolute -left-12 bottom-12 h-24 w-40 rounded-full border-b-2 ${theme.glowBottomA} opacity-80 blur-[1px] sm:-left-16 sm:bottom-20 sm:w-52`} />
      <div className={`pointer-events-none absolute -right-12 bottom-12 h-24 w-40 rounded-full border-b-2 ${theme.glowBottomB} opacity-80 blur-[1px] sm:-right-16 sm:bottom-20 sm:w-52`} />

      <div className={`pointer-events-none absolute -left-14 top-20 h-72 w-28 rounded-full ${theme.auraLeft} blur-3xl sm:-left-20 sm:top-28 sm:h-96 sm:w-36`} />
      <div className={`pointer-events-none absolute -right-14 top-24 h-72 w-28 rounded-full ${theme.auraRight} blur-3xl sm:-right-20 sm:top-32 sm:h-96 sm:w-36`} />
      <div className={`pointer-events-none absolute inset-x-8 bottom-[-14px] h-24 rounded-full ${theme.auraBottom} blur-3xl sm:bottom-[-20px]`} />

      <div
        className={`pointer-events-none absolute -inset-3 ${theme.outerGlow} blur-2xl sm:-inset-5`}
        style={{
          clipPath:
            "polygon(9% 0%, 91% 0%, 100% 9%, 100% 81%, 50% 100%, 0% 81%, 0% 9%)",
        }}
      />

      <div className="relative">
        <div
          className={`absolute inset-0 ${theme.borderGradient} shadow-[0_0_30px_rgba(34,211,238,.22),0_0_38px_rgba(124,58,237,.20)] sm:shadow-[0_0_38px_rgba(34,211,238,.26),0_0_48px_rgba(124,58,237,.24)]`}
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
            className={`absolute inset-0 ${theme.innerGradient}`}
            style={{
              clipPath:
                "polygon(10% 1%, 90% 1%, 98.5% 10%, 98.5% 79.5%, 50% 98.5%, 1.5% 79.5%, 1.5% 10%)",
            }}
          />

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,.055)_42%,transparent_54%)]" />
          <div className="pointer-events-none absolute left-[-40%] top-[-20%] h-[160%] w-[70%] rotate-12 bg-cyan-300/[.035] blur-xl" />
          <div className="pointer-events-none absolute right-[-36%] top-[10%] h-[130%] w-[70%] rotate-[-10deg] bg-fuchsia-400/[.04] blur-xl" />

          <div className="relative z-10 flex h-[438px] flex-col px-4 pb-4 pt-4 sm:h-[505px] sm:px-5 sm:pb-5 sm:pt-5">
            <div className="flex items-start justify-between">
              <div>
                <div className={`text-4xl font-black leading-none ${theme.ratingText} sm:text-5xl`}>
                  {rating}
                </div>

                <div className={`mt-0.5 text-sm font-black uppercase ${theme.softText} sm:mt-1 sm:text-lg`}>
                  RIV
                </div>
              </div>

              <div className={`relative z-20 rounded-xl border ${theme.badgeBorder} bg-black/60 px-2.5 py-1.5 text-center text-[9px] font-black uppercase tracking-[.12em] ${theme.badgeText} ${theme.badgeShadow} sm:rounded-2xl sm:px-3 sm:py-2 sm:text-[11px] sm:tracking-[.14em]`}>
                {rarityLabel}
              </div>
            </div>

            <div className={`pointer-events-none absolute right-4 top-[74px] z-20 flex h-9 w-9 items-center justify-center rounded-2xl border ${theme.badgeBorder} bg-black/35 p-2 ${theme.badgeText} ${theme.badgeShadow} sm:right-5 sm:top-[96px] sm:h-12 sm:w-12 sm:p-2.5`}>
              <SportCardIcon mainSport={mainSport} />
            </div>

            <div className="relative mt-1 flex h-[84px] items-center justify-center sm:mt-3 sm:h-[132px]">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="Foto profilo"
                  className="relative z-10 h-[82px] w-[82px] rounded-[1rem] object-cover shadow-[0_0_18px_rgba(255,255,255,.10)] sm:h-[126px] sm:w-[126px] sm:rounded-[1.25rem] sm:shadow-[0_0_22px_rgba(255,255,255,.12)]"
                />
              ) : (
                <div className="relative z-10 flex h-[82px] w-[82px] items-center justify-center rounded-[1rem] border border-cyan-300/20 bg-black/25 sm:h-[126px] sm:w-[126px] sm:rounded-[1.25rem]">
                  <UserRound size={48} className="text-cyan-200 sm:hidden" />
                  <UserRound size={70} className="hidden text-cyan-200 sm:block" />
                </div>
              )}
            </div>

            <div className="mt-0 text-center">
              <div
                className={`mx-auto flex min-h-[42px] max-w-[90%] items-center justify-center px-1 text-center font-black uppercase leading-[0.92] ${theme.ratingText} [overflow-wrap:anywhere] sm:min-h-[56px] sm:max-w-[88%] sm:px-3 ${cardNameClass}`}
              >
                <span className="line-clamp-2">{displayCardName}</span>
              </div>

              <div className={`mx-auto mt-0.5 flex min-h-[22px] max-w-[84%] items-center justify-center px-2 text-center text-[11px] font-black uppercase leading-tight ${theme.softText} [overflow-wrap:anywhere] sm:mt-1 sm:min-h-[28px] sm:max-w-[84%] sm:px-3 sm:text-lg`}>
                <span className="line-clamp-2">{displayCardSubtitle}</span>
              </div>
              <div className="mx-auto mt-1 w-fit rounded-full border border-white/10 bg-black/30 px-3 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white/80 sm:mt-2 sm:py-1 sm:text-[10px]">
                {sportLabel(mainSport)}
              </div>

              <div className={`mx-auto mt-1 w-fit rounded-full border ${theme.badgeBorder} bg-black/35 px-3 py-0.5 text-[7.5px] font-black uppercase tracking-[0.12em] ${theme.badgeText} sm:py-1 sm:text-[8px]`}>
                {getSportPositionLabel(mainSport, role)}
              </div>
            </div>

            <div className="mt-2 pb-3 pt-1 sm:mt-3 sm:pb-10 sm:pt-1">
              <div className="grid grid-cols-3 gap-1.5 text-center sm:gap-2">
                {stats.map((stat) => (
                  <CardStat
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    theme={theme}
                  />
                ))}
              </div>

              <div className="mx-3 mt-1 grid grid-cols-3 gap-1.5 text-center sm:mx-4 sm:mt-2 sm:gap-2">
                {bottomStats.map((stat) => (
                  <CardFact
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    theme={theme}
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
  theme,
}: {
  value: number;
  label: string;
  theme: ReturnType<typeof getSportTheme>;
}) {
  return (
    <div className={`min-w-0 rounded-lg border ${theme.statBorder} bg-black/35 px-0.5 py-0.5 shadow-[0_0_14px_rgba(0,0,0,.24)] sm:py-1`}>
      <div className={`text-[11px] font-black leading-none ${theme.statText} sm:text-[15px]`}>
        {value}
      </div>

      <div className={`mt-0.5 text-[6.5px] font-black uppercase leading-none ${theme.statLabel} sm:mt-1 sm:text-[8px]`}>
        {label}
      </div>
    </div>
  );
}


function CardFact({
  value,
  label,
  theme,
}: {
  value: number;
  label: string;
  theme: ReturnType<typeof getSportTheme>;
}) {
  return (
    <div className={`min-w-0 rounded-lg border ${theme.badgeBorder} bg-black/25 px-0.5 py-0.5 sm:py-1`}>
      <div className={`text-[9px] font-black leading-none ${theme.badgeText} sm:text-[12px]`}>
        {value}
      </div>

      <div className="mt-0.5 text-[5.5px] font-black uppercase leading-none text-white/65 sm:text-[7px]">
        {label}
      </div>
    </div>
  );
}

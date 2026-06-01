export default function RivaloLogo() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[74px] w-[74px] shrink-0">
        <div className="absolute inset-0 rounded-3xl bg-cyan-400/25 blur-2xl" />

        <svg viewBox="0 0 120 120" className="relative h-[74px] w-[74px]">
          <defs>
            <linearGradient id="rivaloOfficialEdge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="52%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>

            <filter id="rivaloOfficialGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="-3" dy="2" stdDeviation="4" floodColor="#22d3ee" floodOpacity=".65" />
              <feDropShadow dx="4" dy="4" stdDeviation="5" floodColor="#d946ef" floodOpacity=".5" />
            </filter>
          </defs>

          <path
            d="M20 100 L20 13 H71 C93 13 106 27 106 46 C106 61 97 72 83 77 L105 100 H74 L56 76 H49 L49 100 Z"
            fill="white"
            filter="url(#rivaloOfficialGlow)"
          />

          <path
            d="M49 36 H67 C75 36 80 40 80 47 C80 54 75 58 67 58 H49 Z"
            fill="#020617"
          />

          <path
            d="M21 100 L49 76 H61 L29 114 Z"
            fill="url(#rivaloOfficialEdge)"
          />

          <path
            d="M73 78 L105 100 H76 L58 78 Z"
            fill="#d946ef"
            opacity=".55"
          />
        </svg>
      </div>

      <div>
        <div className="text-[40px] font-black leading-none tracking-tight text-white">
          Rivalo
        </div>

        <div className="mt-2 text-[12px] font-black tracking-[.35em] text-cyan-300">
          OWN THE GAME
        </div>
      </div>
    </div>
  );
}

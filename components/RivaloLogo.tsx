export default function RivaloLogo() {
  return (
    <div className="flex items-center gap-4">
      
      <div className="relative h-[74px] w-[74px]">
        
        <div className="absolute inset-0 rounded-3xl bg-cyan-400/30 blur-2xl" />

        <svg
          viewBox="0 0 120 120"
          className="relative h-[74px] w-[74px]"
        >
          <defs>
            <linearGradient
              id="rivaloGrad"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>

          <path
            d="M20 100 L20 15 H72 C92 15 105 28 105 46 C105 60 96 71 82 76 L104 100 H74 L56 76 H49 L49 100 Z"
            fill="white"
          />

          <path
            d="M49 36 H67 C75 36 80 40 80 47 C80 54 75 58 67 58 H49 Z"
            fill="#020617"
          />

          <path
            d="M21 100 L49 76 H61 L29 114 Z"
            fill="url(#rivaloGrad)"
          />

          <path
            d="M73 78 L105 100 H76 L58 78 Z"
            fill="#d946ef"
            opacity=".55"
          />
        </svg>
      </div>

      <div>
        <div className="text-[40px] font-black tracking-tight text-white">
          Rivalo
        </div>

        <div className="text-[12px] font-black tracking-[.35em] text-cyan-300">
          OWN THE GAME
        </div>
      </div>
    </div>
  );
}

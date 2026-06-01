export default function RivaloLogo() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[74px] w-[74px] shrink-0">
        <div className="absolute inset-0 rounded-3xl bg-cyan-400/30 blur-2xl" />
        <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-3xl bg-fuchsia-500/20 blur-2xl" />

        <svg
          viewBox="0 0 120 120"
          className="relative h-[74px] w-[74px] overflow-visible drop-shadow-[0_0_14px_rgba(34,211,238,0.50)]"
          aria-hidden="true"
        >
          {/* Corpo principale della R: sempre bianco pieno, senza filtri SVG che possono creare conflitti */}
          <path
            d="M20 100 L20 13 H71 C93 13 106 27 106 46 C106 61 97 72 83 77 L105 100 H74 L56 76 H49 L49 100 Z"
            fill="#ffffff"
          />

          {/* Foro interno della R */}
          <path
            d="M49 36 H67 C75 36 80 40 80 47 C80 54 75 58 67 58 H49 Z"
            fill="#020617"
          />

          {/* Striscia ufficiale azzurra/blu sulla gambetta sinistra */}
          <path
            d="M21 100 L49 76 H61 L30 114 Z"
            fill="#22d3ee"
          />
          <path
            d="M34 103 L49 76 H61 L30 114 Z"
            fill="#3b82f6"
            opacity="0.95"
          />

          {/* Chiusura fucsia sulla parte destra della gambetta */}
          <path
            d="M45 98 L61 76 L82 100 H58 Z"
            fill="#d946ef"
            opacity="0.72"
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

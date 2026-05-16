export default function RivaloLogo({
  size = 84,
}: {
  size?: number;
}) {
  return (
    <div
      className="relative shrink-0"
      style={{
        width: size,
        height: size,
      }}
    >
      <div className="absolute inset-0 rounded-3xl bg-cyan-400/25 blur-2xl" />
      <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-fuchsia-500/20 blur-2xl" />

      <svg
        viewBox="0 0 120 120"
        className="relative h-full w-full"
        aria-label="Rivalo logo"
      >
        <defs>
          <linearGradient id="logoEdge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>

          <filter id="softGlow">
            <feDropShadow
              dx="-4"
              dy="2"
              stdDeviation="5"
              floodColor="#22d3ee"
              floodOpacity=".65"
            />
            <feDropShadow
              dx="5"
              dy="5"
              stdDeviation="6"
              floodColor="#d946ef"
              floodOpacity=".55"
            />
          </filter>
        </defs>

        <path
          d="M20 103 L20 16 H72 C92 16 105 29 105 47 C105 61 96 72 82 77 L104 103 H75 L57 79 H49 L49 103 Z"
          fill="url(#logoEdge)"
          opacity=".95"
          transform="translate(-5 5)"
        />

        <path
          d="M20 100 L20 13 H71 C93 13 106 27 106 46 C106 61 97 72 83 77 L105 100 H74 L56 76 H49 L49 100 Z"
          fill="white"
          filter="url(#softGlow)"
        />

        <path
          d="M49 36 H67 C75 36 80 40 80 47 C80 54 75 58 67 58 H49 Z"
          fill="#020617"
        />

        <path
          d="M21 100 L49 76 H61 L29 114 Z"
          fill="url(#logoEdge)"
        />

        <path
          d="M73 78 L105 100 H76 L58 78 Z"
          fill="#d946ef"
          opacity=".55"
        />
      </svg>
    </div>
  );
}

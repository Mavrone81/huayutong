export function Logo({ style }: { style?: React.CSSProperties }) {
  return (
    <div className="logo" style={style}>
      <span className="mark" aria-hidden="true">
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="mmLogoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1F4E79" />
              <stop offset="1" stopColor="#0E2235" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" rx="116" fill="url(#mmLogoGrad)" />
          <rect width="512" height="256" rx="116" fill="#FFFFFF" opacity="0.05" />
          <text
            x="50%"
            y="53%"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'Noto Serif SC', serif"
            fontWeight={900}
            fontSize="320"
            fill="#FFFFFF"
          >
            华
          </text>
          <circle cx="402" cy="120" r="34" fill="#E9A23B" />
        </svg>
      </span>
      MandaMix
    </div>
  );
}

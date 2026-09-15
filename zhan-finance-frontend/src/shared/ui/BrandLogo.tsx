interface BrandLogoProps {
  variant?: 'default' | 'inverted' | 'landing' | 'square';
  className?: string;
}

export function BrandLogo({ variant = 'default', className = 'h-8 w-auto' }: BrandLogoProps) {
  const isDark = variant === 'inverted';
  const isSquare = variant === 'square';
  const zhanColor = isDark ? '#F5F5DC' : '#00562D';
  const finColor = isDark ? '#FFFFFF' : '#1F1F1F';
  const lineColor = isDark ? '#F5F5DC' : '#00562D';
  const subColor = isDark ? 'rgba(245,245,220,0.85)' : '#1F1F1F';

  if (isSquare) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 500 500"
        className={className}
        aria-label="ЖАН FINANCE"
      >
        <text
          x="250"
          y="230"
          style={{
            fontFamily: '"a_Simpler", sans-serif',
            fontWeight: 900,
            fontSize: '170px',
            fill: zhanColor,
            textAnchor: 'middle',
          }}
        >
          ЖАН
        </text>
        <text
          x="250"
          y="330"
          style={{
            fontFamily: '"a_Simpler", sans-serif',
            fontWeight: 900,
            fontSize: '92px',
            fill: finColor,
            textAnchor: 'middle',
          }}
        >
          FINANCE
        </text>
        <line
          x1="75"
          y1="360"
          x2="425"
          y2="360"
          stroke={lineColor}
          strokeWidth="7"
          strokeLinecap="butt"
        />
        <text
          x="250"
          y="405"
          style={{
            fontFamily: '"a_Simpler", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 800,
            fontSize: '26px',
            letterSpacing: '3px',
            fill: subColor,
            textAnchor: 'middle',
          }}
        >
          БУХГАЛТЕРЛІК КОМПАНИЯ
        </text>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 760 180"
      className={className}
      aria-label="ЖАН FINANCE"
    >
      <text
        x="25"
        y="146"
        style={{
          fontFamily: '"a_Simpler", sans-serif',
          fontWeight: 900,
          fontSize: '158px',
          fill: zhanColor,
        }}
      >
        ЖАН
      </text>
      <text
        x="385"
        y="96"
        style={{
          fontFamily: '"a_Simpler", sans-serif',
          fontWeight: 900,
          fontSize: '88px',
          fill: finColor,
        }}
      >
        FINANCE
      </text>
      <line
        x1="385"
        y1="110"
        x2="734"
        y2="110"
        stroke={lineColor}
        strokeWidth="7"
        strokeLinecap="butt"
      />
      <text
        x="385"
        y="146"
        style={{
          fontFamily: '"a_Simpler", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontWeight: 800,
          fontSize: '26px',
          letterSpacing: '2px',
          fill: subColor,
        }}
      >
        БУХГАЛТЕРЛІК КОМПАНИЯ
      </text>
    </svg>
  );
}


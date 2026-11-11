import React from 'react';

interface ActivityRingsProps {
  todayCurrent: number;
  todayTarget: number;
  overallCurrent: number;
  overallTotal: number;
  xpCurrent: number;
  xpSpan: number;
  level: number;
  size?: number;
}

export const ActivityRings: React.FC<ActivityRingsProps> = ({
  todayCurrent,
  todayTarget,
  overallCurrent,
  overallTotal,
  xpCurrent,
  xpSpan,
  level,
  size = 140
}) => {
  const center = size / 2;
  const strokeWidth = 10;
  const gap = 3;

  // Radii
  const r1 = center - strokeWidth / 2 - 2; // Outer: Today Target (Flame)
  const r2 = r1 - strokeWidth - gap;      // Middle: Quarter % (Blue)
  const r3 = r2 - strokeWidth - gap;      // Inner: XP to next level (Gold)

  const circ1 = 2 * Math.PI * r1;
  const circ2 = 2 * Math.PI * r2;
  const circ3 = 2 * Math.PI * r3;

  const pct1 = todayTarget > 0 ? Math.min(1, todayCurrent / todayTarget) : 0;
  const pct2 = overallTotal > 0 ? Math.min(1, overallCurrent / overallTotal) : 0;
  const pct3 = xpSpan > 0 ? Math.min(1, xpCurrent / xpSpan) : 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Ring 1: Today Target (Flame / Orange) */}
        <circle
          cx={center}
          cy={center}
          r={r1}
          fill="none"
          stroke="#ffedd5"
          className="dark:stroke-orange-950/40"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={r1}
          fill="none"
          stroke="#ff6b00"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ1}
          strokeDashoffset={circ1 * (1 - pct1)}
          className="transition-all duration-700 ease-out"
        />

        {/* Ring 2: Quarter Completion (Apple Blue) */}
        <circle
          cx={center}
          cy={center}
          r={r2}
          fill="none"
          stroke="#dbeafe"
          className="dark:stroke-blue-950/40"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={r2}
          fill="none"
          stroke="#007aff"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ2}
          strokeDashoffset={circ2 * (1 - pct2)}
          className="transition-all duration-700 ease-out"
        />

        {/* Ring 3: Level XP (Gold / Yellow) */}
        <circle
          cx={center}
          cy={center}
          r={r3}
          fill="none"
          stroke="#fef9c3"
          className="dark:stroke-amber-950/40"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={r3}
          fill="none"
          stroke="#eab308"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ3}
          strokeDashoffset={circ3 * (1 - pct3)}
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Lv
        </span>
        <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums leading-none">
          {level}
        </span>
      </div>
    </div>
  );
};

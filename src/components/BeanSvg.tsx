import React from 'react';

interface BeanSvgProps {
  mood: 'knit' | 'tea' | 'sleep' | 'sad' | 'happy';
  size?: number;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

const INK = 'stroke="var(--ink, #0f172a)" stroke-width="2.5" stroke-linejoin="round"';

export const BeanSvg: React.FC<BeanSvgProps> = ({
  mood,
  size = 112,
  className = '',
  onClick,
  interactive = false
}) => {
  const m = mood === 'sad' ? 'sad' : mood === 'sleep' ? 'sleep' : 'happy';
  const pose = mood === 'tea' ? 'tea' : 'knit';
  const isKnitting = mood === 'knit';

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${interactive ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${className}`}
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      <svg
        className={`bean ${mood} w-full h-full overflow-visible`}
        viewBox="-62 -118 130 132"
        aria-hidden="true"
      >
        <g
          className={`bf m-${m} p-${pose} ${isKnitting ? 'knitting' : ''}`}
          data-bean="1"
        >
          {/* Shadow */}
          <ellipse
            className="bf-sh"
            cx="0"
            cy="2"
            rx="28"
            ry="5"
            fill="rgba(0,0,0,0.18)"
          />

          <g className="bf-all">
            {/* Feet */}
            <g className="bf-fl">
              <ellipse
                cx="-13"
                cy="-5"
                rx="10"
                ry="6"
                fill="#c98a50"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </g>
            <g className="bf-fr">
              <ellipse
                cx="13"
                cy="-5"
                rx="10"
                ry="6"
                fill="#c98a50"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </g>

            {/* Body */}
            <g className="bf-body">
              <path
                d="M-31 -40 C-35 -80 -8 -94 8 -90 C32 -86 38 -60 32 -38 C28 -16 12 -8 -3 -8 C-21 -8 -29 -22 -31 -40Z"
                fill="#eaae70"
                stroke="#0f172a"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path
                d="M-23 -62 C-22 -76 -11 -84 0 -85"
                fill="none"
                stroke="#ffffff"
                strokeOpacity="0.55"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <ellipse cx="-16" cy="-42" rx="6" ry="4" fill="#f08a7a" opacity="0.65" />
              <ellipse cx="26" cy="-42" rx="6" ry="4" fill="#f08a7a" opacity="0.65" />

              {/* Eyes */}
              <g className="e-h bf-eyes">
                <ellipse cx="-7" cy="-58" rx="4" ry="5" fill="#0f172a" />
                <ellipse cx="15" cy="-58" rx="4" ry="5" fill="#0f172a" />
                <circle cx="-5.8" cy="-60" r="1.4" fill="#ffffff" />
                <circle cx="16.2" cy="-60" r="1.4" fill="#ffffff" />
              </g>
              <g className="e-s bf-eyes">
                <ellipse cx="-7" cy="-56" rx="4" ry="5" fill="#0f172a" />
                <ellipse cx="15" cy="-56" rx="4" ry="5" fill="#0f172a" />
                <path d="M-14 -66 L-2 -62 M22 -66 L10 -62" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M-10 -48 q-4 7 0 9 q4 -2 0 -9z" fill="#38bdf8" />
              </g>
              <path
                className="e-z"
                d="M-13 -57 q6 5 12 0 M9 -57 q6 5 12 0"
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Mouths */}
              <path className="mo-h" d="M-2 -46 Q4 -39 10 -46" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              <path className="mo-s" d="M-2 -40 Q4 -47 10 -40" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              <ellipse className="mo-z" cx="4" cy="-43" rx="3" ry="2.5" fill="#0f172a" />

              {/* Red Winter Hat */}
              <g className="hat">
                <path
                  d="M-25 -76 C-24 -106 29 -108 31 -78 Q3 -86 -25 -76Z"
                  fill="#e5484d"
                  stroke="#0f172a"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path
                  d="M-24 -80 Q3 -89 30 -81"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeOpacity="0.85"
                />
                <circle
                  className="pom"
                  cx="3"
                  cy="-106"
                  r="6"
                  fill="#ffffff"
                  stroke="#0f172a"
                  strokeWidth="2.5"
                />
              </g>
            </g>

            {/* Resting Arms */}
            <g className="pa">
              <ellipse cx="-34" cy="-38" rx="6.5" ry="10" fill="#eaae70" stroke="#0f172a" strokeWidth="2.5" />
              <ellipse cx="36" cy="-38" rx="6.5" ry="10" fill="#eaae70" stroke="#0f172a" strokeWidth="2.5" />
            </g>

            {/* Knitting Needles & Sock */}
            <g className="pk">
              <g className="sock">
                <path
                  d="M-8 -26 h16 v22 q0 6 -8 6 t-8 -6z"
                  fill="#ff7a1a"
                  stroke="#0f172a"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path d="M-8 -20 h16 M-8 -13 h16" stroke="#ffffff" strokeWidth="2" />
              </g>
              <line className="nl" x1="-24" y1="-26" x2="4" y2="-6" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              <line className="nr" x1="28" y1="-26" x2="0" y2="-6" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              <circle cx="-24" cy="-26" r="6" fill="#eaae70" stroke="#0f172a" strokeWidth="2.5" />
              <circle cx="28" cy="-26" r="6" fill="#eaae70" stroke="#0f172a" strokeWidth="2.5" />
            </g>

            {/* Tea Cup */}
            <g className="pt">
              <path d="M18 -34 h22 v12 q0 9 -11 9 q-11 0 -11 -9z" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
              <path d="M40 -32 q9 0 9 6 q0 6 -9 6" fill="none" stroke="#0f172a" strokeWidth="2.5" />
              <path d="M26 -40 q-4 -5 0 -9 M34 -40 q-4 -5 0 -9" className="st" fill="none" stroke="#8a93ad" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="-34" cy="-34" r="6.5" fill="#eaae70" stroke="#0f172a" strokeWidth="2.5" />
              <circle cx="20" cy="-30" r="6.5" fill="#eaae70" stroke="#0f172a" strokeWidth="2.5" />
            </g>

            {/* Floating zzz */}
            <text className="zz fill-blue-600 dark:fill-blue-400" x="30" y="-82">
              z
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
};

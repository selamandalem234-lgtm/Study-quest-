import React, { useRef, useEffect, useState } from 'react';
import { DECOR } from '../constants.ts';
import { BeanSvg } from './BeanSvg.tsx';

interface BeansWorldProps {
  socks: number;
  decor: Record<string, boolean>;
  onBuyDecor: (id: string, cost: number, name: string) => void;
  onToast: (msg: string) => void;
}

const INK = 'stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round"';
const bk = (x: number, y: number, h: number, c: string) =>
  `<rect x="${x}" y="${y}" width="8" height="${h}" fill="${c}" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/>`;

const ART: Record<string, string> = {
  plant: `<g class="wsway" style="transform-origin:0 -28px;animation-duration:3.4s"><path d="M0 -28 C-18 -36 -22 -54 -10 -64 C-4 -52 -2 -40 0 -28Z" fill="#4fb36b" ${INK}/><path d="M0 -28 C16 -40 24 -56 14 -68 C6 -56 2 -42 0 -28Z" fill="#3a9c58" ${INK}/><path d="M0 -28 C-3 -44 4 -60 0 -74 C-8 -58 -6 -42 0 -28Z" fill="#66c57f" ${INK}/></g><path d="M-16 -28 H16 L11 0 H-11Z" fill="#d9774a" ${INK}/><rect x="-19" y="-33" width="38" height="8" rx="3" fill="#e98c5b" ${INK}/>`,
  candle: `<circle class="glow" cx="0" cy="-54" r="24" fill="#ffd93d" opacity=".3"/><ellipse cx="0" cy="-3" rx="17" ry="5" fill="#c9a86a" ${INK}/><rect x="-8" y="-42" width="16" height="40" rx="3" fill="#fff4d6" ${INK}/><path d="M0 -42 v-4" stroke="#0f172a" stroke-width="2"/><path class="flame" d="M0 -68 C-8 -58 -6 -48 0 -46 C6 -48 8 -58 0 -68Z" fill="#ff9a1a" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>`,
  chair: `<rect x="-30" y="-60" width="60" height="40" rx="15" fill="#6c7ae0" ${INK}/><rect x="-39" y="-40" width="16" height="32" rx="8" fill="#5866cf" ${INK}/><rect x="23" y="-40" width="16" height="32" rx="8" fill="#5866cf" ${INK}/><rect x="-29" y="-28" width="58" height="19" rx="7" fill="#7f8cf0" ${INK}/><rect x="-28" y="-10" width="6" height="10" fill="#0f172a"/><rect x="22" y="-10" width="6" height="10" fill="#0f172a"/>`,
  frame: `<path d="M-24 0 L0 -88 M24 0 L0 -88" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/><rect x="-28" y="-84" width="56" height="44" rx="3" fill="#ffffff" ${INK}/><rect x="-23" y="-79" width="46" height="34" fill="#bfe6ff"/><path d="M-23 -45 L-9 -64 L2 -53 L11 -66 L23 -45Z" fill="#56ad4c"/><circle cx="13" cy="-69" r="4.5" fill="#ffd93d"/>`,
  rug: `<path d="M-30 -30 H30 L24 0 H-24Z" fill="#d9a86a" ${INK}/><path d="M-27 -20 H27 M-25 -10 H25" stroke="#a9763a" stroke-width="2"/><g class="wob" style="transform-origin:-10px -28px"><circle cx="-10" cy="-40" r="14" fill="#ff7a1a" ${INK}/><path d="M-21 -45 Q-10 -36 1 -45 M-21 -38 Q-10 -29 1 -38" stroke="#ffffff" stroke-opacity=".6" fill="none" stroke-width="2"/></g><circle cx="15" cy="-38" r="11" fill="#2b4bd6" ${INK}/>`,
  books: `<rect x="-34" y="-98" width="68" height="98" rx="4" fill="#b8793e" ${INK}/><rect x="-28" y="-92" width="56" height="26" fill="#8d5a2b"/><rect x="-28" y="-60" width="56" height="26" fill="#8d5a2b"/><rect x="-28" y="-28" width="56" height="24" fill="#8d5a2b"/>${bk(-25, -90, 22, '#e5484d')}${bk(-15, -88, 20, '#ffd93d')}${bk(-5, -90, 22, '#2b4bd6')}${bk(5, -86, 18, '#0f7a5a')}${bk(15, -90, 22, '#ff7a1a')}${bk(-25, -58, 22, '#6c7ae0')}${bk(-15, -56, 20, '#e5484d')}${bk(-5, -58, 22, '#fff4d6')}${bk(10, -58, 22, '#0f7a5a')}${bk(-25, -26, 20, '#ffd93d')}${bk(-14, -24, 18, '#2b4bd6')}${bk(0, -26, 20, '#e5484d')}`
};

const SAYS = [
  'Knit one, purl one! 🧶',
  'Study hard, nap soft. 💤',
  'I’m so proud of your hard work! 🫘',
  'Got any warm socks to spare? 🧦',
  'Let’s focus together today!',
  'You’re doing great in Grade 10! ✨',
  'Small daily pages climb big mountains!'
];

export const BeansWorld: React.FC<BeansWorldProps> = ({
  socks,
  decor,
  onBuyDecor,
  onToast
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [speech, setSpeech] = useState<string>('');
  const [speechVisible, setSpeechVisible] = useState(false);
  const speechTimer = useRef<number | null>(null);

  // Bean world walking logic
  const beanPos = useRef({
    x: 260,
    target: 260,
    v: 0,
    face: 1,
    dir: 1,
    phase: 0,
    state: 'idle' as 'walk' | 'idle' | 'knit' | 'wave' | 'cheer',
    until: 0,
    puff: 0
  });

  const showSpeech = (text: string) => {
    setSpeech(text);
    setSpeechVisible(true);
    if (speechTimer.current) clearTimeout(speechTimer.current);
    speechTimer.current = window.setTimeout(() => setSpeechVisible(false), 3000);
  };

  const handleBeanClick = () => {
    beanPos.current.state = 'wave';
    beanPos.current.until = performance.now() + 2000;
    const randomSay = SAYS[Math.floor(Math.random() * SAYS.length)];
    showSpeech(randomSay);
  };

  const handleCatClick = () => {
    const cat = svgRef.current?.querySelector('.cat');
    if (cat) {
      cat.classList.add('purr');
      showSpeech('Purrrrr... 🐱 (Warm and happy!)');
      setTimeout(() => cat.classList.remove('purr'), 2200);
    }
  };

  const handleDecorClick = (d: (typeof DECOR)[0]) => {
    if (decor[d.id]) {
      showSpeech(`I love my ${d.n.toLowerCase()}! 💛`);
      return;
    }
    if (socks < d.c) {
      onToast(`You need ${d.c - socks} more sock${d.c - socks === 1 ? '' : 's'} for the ${d.n}. Complete a focus sprint!`);
      return;
    }
    onBuyDecor(d.id, d.c, d.n);
    beanPos.current.state = 'cheer';
    beanPos.current.until = performance.now() + 2000;
    showSpeech(`Thank you! The ${d.n} looks wonderful here! 🎉`);
  };

  // Parallax on horizontal scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const x = container.scrollLeft;
      const far = container.querySelector('.w-far') as HTMLElement | null;
      const mid = container.querySelector('.w-mid') as HTMLElement | null;
      const sky = container.querySelector('.w-sky') as HTMLElement | null;
      if (far) far.style.transform = `translateX(${x * 0.55}px)`;
      if (mid) mid.style.transform = `translateX(${x * 0.3}px)`;
      if (sky) sky.style.transform = `translateX(${x * 0.8}px)`;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Bean animation loop
  useEffect(() => {
    let raf = 0;
    let last = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const b = beanPos.current;

      if (b.state === 'walk') {
        const d = b.target - b.x;
        b.dir = d >= 0 ? 1 : -1;
        const sp = 58 * Math.max(0.2, Math.min(1, Math.abs(d) / 45));
        b.v += (b.dir * sp - b.v) * Math.min(1, dt * 5);
        b.x += b.v * dt;

        if (Math.abs(d) < 3 && Math.abs(b.v) < 8) {
          b.v = 0;
          b.state = Math.random() < 0.65 ? 'knit' : 'idle';
          b.until = now + 3500 + Math.random() * 3500;
        }
      } else {
        b.v += (0 - b.v) * Math.min(1, dt * 8);
        if (now > b.until) {
          if (b.state === 'wave' || b.state === 'cheer') {
            b.state = 'idle';
            b.until = now + 1200;
          } else {
            // Pick next destination near owned decor or scenery
            const spots = [320, 460, 560].concat(DECOR.filter(d => decor[d.id]).map(d => d.x - 60));
            let t = b.x;
            for (let n = 0; n < 8; n++) {
              t = spots[Math.floor(Math.random() * spots.length)];
              if (Math.abs(t - b.x) > 40) break;
            }
            b.target = t;
            b.state = 'walk';
          }
        }
      }

      b.face += (b.dir - b.face) * Math.min(1, dt * 9);
      b.phase += Math.abs(b.v) * dt * 0.12;

      // Update bean SVG in DOM
      const beanG = svgRef.current?.querySelector('#wBean');
      const speechG = svgRef.current?.querySelector('#wSay');
      if (beanG) {
        beanG.setAttribute('transform', `translate(${b.x.toFixed(1)} 258)`);
      }
      if (speechG) {
        speechG.setAttribute('transform', `translate(${b.x.toFixed(1)} 150)`);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [decor]);

  // Scenery generation
  let sd = 11;
  const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const stars = [...Array(38)]
    .map(
      () =>
        `<circle class="star" cx="${(R() * 1500) | 0}" cy="${(8 + R() * 120) | 0}" r="${(1 + R() * 1.4).toFixed(1)}" fill="#ffffff" style="animation-delay:-${(R() * 3).toFixed(1)}s"/>`
    )
    .join('');

  const flies = [...Array(12)]
    .map(
      () =>
        `<g transform="translate(${(R() * 1500) | 0} ${(170 + R() * 80) | 0})"><g style="animation:ffloat ${(7 + R() * 6).toFixed(1)}s ease-in-out infinite alternate;animation-delay:-${(R() * 6).toFixed(1)}s"><circle r="7" fill="#ffe86a" opacity=".28"/><circle class="star" r="2.2" fill="#fff8a0"/></g></g>`
    )
    .join('');

  const rain = [...Array(30)]
    .map(
      () =>
        `<line x1="${(R() * 1650) | 0}" y1="0" x2="${(R() * 1650 - 4) | 0}" y2="14" stroke="#cfe6ff" stroke-width="1.6" stroke-linecap="round" style="animation-delay:-${(R() * 0.8).toFixed(2)}s"/>`
    )
    .join('');

  const rbw = ['#e5484d', '#ff7a1a', '#ffd93d', '#4fb36b', '#4aa8ff', '#5b4bd6', '#a24bd6']
    .map((c, i) => `<path d="M${700 + i * 7} 262 A${160 - i * 7} ${160 - i * 7} 0 0 1 ${1020 - i * 7} 262" fill="none" stroke="${c}" stroke-width="7"/>`)
    .join('');

  let tufts = '';
  for (let x = 6; x < 1600; x += 34) {
    tufts += `<path d="M${x} 300 q-2 -20 -9 -28 q8 6 11 14 q1 -12 7 -22 q-2 14 0 36z" fill="${x % 68 ? '#4fa844' : '#5cbb50'}"/>`;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* World Canvas Container */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto overflow-y-hidden rounded-3xl border border-slate-200 dark:border-white/10 shadow-inner bg-sky-200 relative select-none"
        style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        <svg
          ref={svgRef}
          className="w-svg block"
          style={{ width: 1600, height: 300 }}
          viewBox="0 0 1600 300"
          role="img"
          aria-label="Bean's Meadow"
        >
          <defs>
            <linearGradient id="wsk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7cc8ff" />
              <stop offset="0.7" stopColor="#d6f0ff" />
              <stop offset="1" stopColor="#f1fbe6" />
            </linearGradient>
            <linearGradient id="wgr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7ccf6a" />
              <stop offset="1" stopColor="#4f9f45" />
            </linearGradient>
          </defs>

          {/* Sky background & Golden sunset tint */}
          <rect width="1600" height="300" fill="url(#wsk)" />
          <rect className="tint" width="1600" height="300" fill="#ff9a5b" />

          {/* Sky elements (Stars, Moon, Sun, Clouds) */}
          <g className="w-sky">
            <g className="stars" dangerouslySetInnerHTML={{ __html: stars }} />
            <g className="moonb">
              <circle cx="190" cy="76" r="23" fill="#fff6d8" stroke="#e8dcae" strokeWidth="2" />
              <circle cx="181" cy="69" r="4" fill="#ecdfb4" />
              <circle cx="199" cy="84" r="3" fill="#ecdfb4" />
              <circle cx="203" cy="66" r="2.4" fill="#ecdfb4" />
            </g>
            <g className="sunb">
              <circle className="halo" cx="110" cy="66" r="62" fill="#fff6b0" opacity=".45" />
              <g className="rays" stroke="#ffd93d" strokeWidth="5" strokeLinecap="round">
                {[...Array(12)].map((_, i) => (
                  <line
                    key={i}
                    x1="110"
                    y1={66 - 44}
                    x2="110"
                    y2={66 - 56}
                    transform={`rotate(${i * 30} 110 66)`}
                  />
                ))}
              </g>
              <circle cx="110" cy="66" r="30" fill="#ffd93d" stroke="#ffb300" strokeWidth="3" />
            </g>

            {/* Clouds */}
            <g className="cloud" style={{ '--d': '110s', animationDelay: '-20s' } as any}>
              <g transform="translate(0 60)" fill="#ffffff" stroke="#cfe3f5" strokeWidth="2">
                <ellipse cx="0" cy="0" rx="40" ry="16" />
                <circle cx="-14" cy="-12" r="16" />
                <circle cx="12" cy="-16" r="20" />
              </g>
            </g>
            <g className="cloud" style={{ '--d': '150s', animationDelay: '-90s' } as any}>
              <g transform="translate(0 110)" fill="#ffffff" stroke="#cfe3f5" strokeWidth="2">
                <ellipse cx="0" cy="0" rx="40" ry="16" />
                <circle cx="-14" cy="-12" r="16" />
                <circle cx="12" cy="-16" r="20" />
              </g>
            </g>
          </g>

          {/* Rainbow */}
          <g className="rb" dangerouslySetInnerHTML={{ __html: rbw }} />

          {/* Mountains & Windmill */}
          <g className="w-far">
            <path d="M300 192 L470 82 L522 122 L600 60 L760 192Z" fill="#a9c1e6" />
            <path d="M600 60 L575 85 L592 79 L602 92 L614 79 L630 87Z" fill="#ffffff" />
            <path d="M900 192 L1060 102 L1120 136 L1210 76 L1390 192Z" fill="#9db6df" />
            <path d="M1210 76 L1186 100 L1202 94 L1212 106 L1224 94 L1240 101Z" fill="#ffffff" />
            {/* Windmill */}
            <path d="M848 192 L853 132 H867 L872 192Z" fill="#f1e4c6" stroke="#0f172a" strokeWidth="2" />
            <path d="M846 132 L860 118 L874 132Z" fill="#e5484d" stroke="#0f172a" strokeWidth="2" />
            <g className="blades" style={{ transformOrigin: '860px 130px' }}>
              <path d="M860 130 V94 M860 130 H896 M860 130 V166 M860 130 H824" stroke="#0f172a" strokeWidth="9" strokeLinecap="round" />
              <path d="M860 130 V94 M860 130 H896 M860 130 V166 M860 130 H824" stroke="#fff8e6" strokeWidth="5" strokeLinecap="round" />
            </g>
            <circle cx="860" cy="130" r="4" fill="#0f172a" />
          </g>

          {/* Midground Hills */}
          <g className="w-mid">
            <path d="M0 214 Q100 168 200 214 T400 214 T600 214 T800 214 T1000 214 T1200 214 T1400 214 T1600 214 V300 H0Z" fill="#94d184" />
          </g>

          {/* Ground & Path */}
          <path d="M0 240 Q200 232 400 240 T800 240 T1200 240 T1600 240 V300 H0Z" fill="url(#wgr)" stroke="#0f172a" strokeWidth="3" />
          <path d="M0 262 Q400 254 800 262 T1600 262" stroke="#ecd9a0" strokeWidth="16" fill="none" strokeLinecap="round" opacity=".85" />

          {/* Pond with Jumping Frog & Ripples */}
          <g>
            <ellipse cx="300" cy="251" rx="58" ry="11" fill="#6ec6ff" stroke="#0f172a" strokeWidth="2.5" />
            <ellipse cx="286" cy="248" rx="22" ry="3" fill="#ffffff" opacity=".45" />
            <ellipse className="rip" cx="318" cy="253" rx="10" ry="2.5" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <ellipse className="rip" cx="268" cy="252" rx="10" ry="2.5" fill="none" stroke="#ffffff" strokeWidth="1.5" style={{ animationDelay: '-1.6s' }} />
            <g transform="translate(280 250)">
              <g className="frog">
                <ellipse cx="0" cy="-5" rx="7" ry="5" fill="#59c26b" stroke="#0f172a" strokeWidth="1.8" />
                <circle cx="-3" cy="-10" r="2.6" fill="#ffffff" stroke="#0f172a" strokeWidth="1.4" />
                <circle cx="3" cy="-10" r="2.6" fill="#ffffff" stroke="#0f172a" strokeWidth="1.4" />
                <circle cx="-3" cy="-10" r="1" fill="#0f172a" />
                <circle cx="3" cy="-10" r="1" fill="#0f172a" />
              </g>
            </g>
          </g>

          {/* House with Chimney Smoke & Window */}
          <g className="house">
            <circle className="sm" cx="132" cy="150" r="9" fill="#ffffff" style={{ animationDelay: '0s' }} />
            <circle className="sm" cx="132" cy="150" r="9" fill="#ffffff" style={{ animationDelay: '1.5s' }} />
            <circle className="sm" cx="132" cy="150" r="9" fill="#ffffff" style={{ animationDelay: '3s' }} />
            <rect x="120" y="158" width="18" height="34" fill="#c46b4b" stroke="#0f172a" strokeWidth="2.5" />
            <rect x="36" y="188" width="128" height="62" rx="4" fill="#f6d9a8" stroke="#0f172a" strokeWidth="2.5" />
            <path d="M26 192 L100 138 L174 192Z" fill="#d9534f" stroke="#0f172a" strokeWidth="2.5" />
            <rect x="52" y="206" width="30" height="26" rx="3" fill="#ffe27a" stroke="#0f172a" strokeWidth="2.5" />
            <rect className="win" x="52" y="206" width="30" height="26" rx="3" fill="#fff6b0" />
            <path d="M67 206 v26 M52 219 h30" stroke="#0f172a" strokeWidth="2" />
            <path d="M110 250 v-34 q0 -12 14 -12 t14 12 v34z" fill="#8a5a2b" stroke="#0f172a" strokeWidth="2.5" />
            <circle cx="132" cy="230" r="2.5" fill="#ffd93d" />
          </g>

          {/* Trees, Flowers & Swing */}
          <rect x="1438" y="186" width="50" height="6" rx="3" fill="#8a5a2b" stroke="#0f172a" strokeWidth="2.5" />
          <g className="swing" style={{ transformOrigin: '1462px 190px' }}>
            <path d="M1448 190 V228 M1476 190 V228" stroke="#8a5a2b" strokeWidth="2.5" />
            <rect x="1440" y="226" width="42" height="7" rx="3" fill="#d9a86a" stroke="#0f172a" strokeWidth="2.5" />
          </g>

          {/* Napping Cat */}
          <g className="cat" onClick={handleCatClick} transform="translate(205 258)">
            <rect x="-34" y="-40" width="82" height="44" fill="transparent" />
            <g className="breath">
              <ellipse cx="0" cy="-12" rx="24" ry="13" fill="#f3a65a" stroke="#0f172a" strokeWidth="2.5" />
              <path d="M-8 -24 q2 6 0 10 M2 -25 q2 6 0 11 M12 -23 q2 6 0 10" stroke="#c97a2e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            </g>
            <path className="tail" d="M22 -8 Q42 -10 40 -28" fill="none" stroke="#f3a65a" strokeWidth="7" strokeLinecap="round" />
            <circle cx="-22" cy="-14" r="10" fill="#f3a65a" stroke="#0f172a" strokeWidth="2.5" />
            <path d="M-30 -21 L-28 -33 L-21 -24Z M-17 -24 L-13 -33 L-12 -21Z" fill="#f3a65a" stroke="#0f172a" strokeWidth="2" />
            <path d="M-28 -14 q3 3 6 0" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="-30" cy="-11" r="1.6" fill="#e58a8a" />
            <text x="-8" y="-38">
              z
            </text>
          </g>

          {/* Hopping Bunny & Snail */}
          <g className="snail">
            <g transform="translate(0 284)">
              <path d="M-12 0 Q4 -4 16 -2 Q20 -8 18 -10 Q22 -4 18 0Z" fill="#d9c7a0" stroke="#0f172a" strokeWidth="1.6" />
              <g className="stalk">
                <path d="M16 -5 L19 -14" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
              </g>
              <circle cx="-2" cy="-8" r="8" fill="#e5a15b" stroke="#0f172a" strokeWidth="1.8" />
              <path d="M-2 -8 m-4 0 a4 4 0 1 1 4 4" fill="none" stroke="#a9632b" strokeWidth="1.6" />
            </g>
          </g>
          <g className="bun">
            <g transform="translate(0 272)">
              <g className="bh">
                <ellipse cx="-12" cy="-8" rx="5" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" />
                <ellipse cx="0" cy="-10" rx="13" ry="9" fill="#f4efe8" stroke="#0f172a" strokeWidth="1.8" />
                <circle cx="14" cy="-17" r="7" fill="#f4efe8" stroke="#0f172a" strokeWidth="1.8" />
                <ellipse cx="11" cy="-31" rx="3" ry="10" fill="#f4efe8" stroke="#0f172a" strokeWidth="1.6" transform="rotate(-8 11 -31)" />
                <ellipse cx="17" cy="-30" rx="3" ry="10" fill="#f4efe8" stroke="#0f172a" strokeWidth="1.6" transform="rotate(14 17 -30)" />
                <circle cx="17" cy="-18" r="1.4" fill="#0f172a" />
                <circle cx="21" cy="-15" r="1.4" fill="#f08a9a" />
              </g>
            </g>
          </g>

          {/* Night overlay & Lanterns */}
          <rect className="night" width="1600" height="300" fill="#0d1b4a" />
          <g className="lights">
            <circle cx="410" cy="166" r="52" fill="#ffd93d" opacity=".32" />
            <path d="M402 176 L376 252 H444 L418 176Z" fill="#ffd93d" opacity=".14" />
            <rect x="52" y="206" width="30" height="26" rx="3" fill="#ffd266" opacity=".95" />
            <path d="M67 206 v26 M52 219 h30" stroke="#0f172a" strokeWidth="2" />
          </g>

          {/* Unlockable Decorations */}
          {DECOR.map(d => {
            const has = !!decor[d.id];
            const can = !has && socks >= d.c;
            return (
              <g
                key={d.id}
                className={`spot ${d.id} ${has ? 'owned' : 'locked'} ${can ? 'can' : ''}`}
                transform={`translate(${d.x} 258)`}
                onClick={() => handleDecorClick(d)}
                tabIndex={0}
                role="button"
                aria-label={`${d.n}, ${has ? 'unlocked' : `costs ${d.c} socks`}`}
              >
                <rect x="-38" y={-d.h - 8} width="76" height={d.h + 14} fill="transparent" />
                <g className="art" dangerouslySetInnerHTML={{ __html: ART[d.id] }} />
                <g className="tag" transform={`translate(0 ${-d.h - 16})`}>
                  <rect x="-30" y="-13" width="60" height="24" rx="12" fill={can ? '#fde047' : '#ffffff'} stroke="#0f172a" strokeWidth="2" />
                  <text textAnchor="middle" y="4" fontSize="13" fontWeight="800" fill="#0f172a">
                    🧦 {d.c}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Interactive Walking Bean */}
          <g id="wBean" transform="translate(260 258)" onClick={handleBeanClick} className="cursor-pointer">
            <g className="bf m-happy p-arms" data-bean="1">
              <ellipse className="bf-sh" cx="0" cy="2" rx="28" ry="5" fill="rgba(0,0,0,.18)" />
              <g className="bf-all">
                <g className="bf-fl">
                  <ellipse cx="-13" cy="-5" rx="10" ry="6" fill="#c98a50" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
                </g>
                <g className="bf-fr">
                  <ellipse cx="13" cy="-5" rx="10" ry="6" fill="#c98a50" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
                </g>
                <g className="bf-body">
                  <path d="M-31 -40 C-35 -80 -8 -94 8 -90 C32 -86 38 -60 32 -38 C28 -16 12 -8 -3 -8 C-21 -8 -29 -22 -31 -40Z" fill="#eaae70" stroke="#0f172a" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M-23 -62 C-22 -76 -11 -84 0 -85" fill="none" stroke="#ffffff" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
                  <ellipse cx="-16" cy="-42" rx="6" ry="4" fill="#f08a7a" opacity=".65" />
                  <ellipse cx="26" cy="-42" rx="6" ry="4" fill="#f08a7a" opacity=".65" />
                  <g className="e-h bf-eyes">
                    <ellipse cx="-7" cy="-58" rx="4" ry="5" fill="#0f172a" />
                    <ellipse cx="15" cy="-58" rx="4" ry="5" fill="#0f172a" />
                    <circle cx="-5.8" cy="-60" r="1.4" fill="#ffffff" />
                    <circle cx="16.2" cy="-60" r="1.4" fill="#ffffff" />
                  </g>
                  <path className="mo-h" d="M-2 -46 Q4 -39 10 -46" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                  <g className="hat">
                    <path d="M-25 -76 C-24 -106 29 -108 31 -78 Q3 -86 -25 -76Z" fill="#e5484d" stroke="#0f172a" strokeWidth="3" strokeLinejoin="round" />
                    <path d="M-24 -80 Q3 -89 30 -81" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeOpacity=".85" />
                    <circle className="pom" cx="3" cy="-106" r="6" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
                  </g>
                </g>
                <g className="pa">
                  <ellipse className="bf-al" cx="-34" cy="-38" rx="6.5" ry="10" fill="#eaae70" stroke="#0f172a" strokeWidth="2.5" />
                  <ellipse className="bf-ar" cx="36" cy="-38" rx="6.5" ry="10" fill="#eaae70" stroke="#0f172a" strokeWidth="2.5" />
                </g>
              </g>
            </g>
          </g>

          {/* Speech Bubble */}
          <g id="wSay" className={`say ${speechVisible ? 'on' : ''}`} transform="translate(260 150)">
            <rect
              id="wSayR"
              x={-Math.max(80, speech.length * 8 + 24) / 2}
              y="-28"
              width={Math.max(80, speech.length * 8 + 24)}
              height="34"
              rx="17"
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            <text id="wSayT" textAnchor="middle" y="-6" fontSize="13" fontWeight="800" fill="#0f172a">
              {speech}
            </text>
          </g>

          {/* Grass Tufts & Weather */}
          <g className="tufts" dangerouslySetInnerHTML={{ __html: tufts }} />
          <g className="flies" dangerouslySetInnerHTML={{ __html: flies }} />
          <g className="rainc">
            <rect width="1600" height="300" fill="#5b6b8c" opacity=".2" />
            <g dangerouslySetInnerHTML={{ __html: rain }} />
          </g>
        </svg>
      </div>

      {/* Exploration Footer Hint */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>👈 Swipe horizontally to explore Bean’s World</span>
        <span>Tap the cat or Bean to interact! 🐾</span>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { IslandData, CropData } from '../firebase.ts';
import { BeanSvg } from './BeanSvg.tsx';
import { DECOR } from '../constants.ts';
import {
  Sparkles,
  Droplets,
  Home,
  Navigation,
  Compass,
  ArrowLeft,
  Share2,
  Users,
  Palette,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FloatingIslandViewProps {
  island: IslandData;
  crops: CropData[];
  isVisiting: boolean;
  onHarvestCrop?: (plotId: string) => void;
  onPlantCrop?: (plotId: string) => void;
  onWaterSoil?: () => void;
  onReturnHome?: () => void;
  onOpenWardrobe?: () => void;
  onOpenShop?: () => void;
  onOpenMap?: () => void;
  onOpenFriends?: () => void;
  studyMinutesToday: number;
}

export const FloatingIslandView: React.FC<FloatingIslandViewProps> = ({
  island,
  crops,
  isVisiting,
  onHarvestCrop,
  onPlantCrop,
  onReturnHome,
  onOpenWardrobe,
  onOpenShop,
  onOpenMap,
  onOpenFriends,
  studyMinutesToday
}) => {
  const [speech, setSpeech] = useState<string>('');
  const [showSpeech, setShowSpeech] = useState(false);
  const [catPurring, setCatPurring] = useState(false);

  const triggerSpeech = (text: string) => {
    setSpeech(text);
    setShowSpeech(true);
    setTimeout(() => setShowSpeech(false), 3200);
  };

  const handleCatTap = () => {
    setCatPurring(true);
    triggerSpeech('Purrr... 🐱 (The island cat is cozy and content)');
    confetti({
      particleCount: 20,
      spread: 60,
      origin: { y: 0.7 }
    });
    setTimeout(() => setCatPurring(false), 2000);
  };

  const handleBeanTap = () => {
    const lines = isVisiting
      ? [
          `Welcome to ${island.ownerName}'s island! 🎈`,
          'We study hard and grow delicious crops here! ✨',
          'Feel free to look around our cozy garden! 🌾'
        ]
      : [
          'Knit one, purl one! Cozy study time. 🧶',
          'Every minute you focus waters our crops! 💧',
          'Look how beautiful our floating home is becoming! 🏡',
          'Ready for our next study quest? 📚'
        ];
    triggerSpeech(lines[Math.floor(Math.random() * lines.length)]);
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100 dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950 select-none">
      {/* Visiting Banner */}
      {isVisiting && (
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between p-3 rounded-2xl bg-slate-900/85 backdrop-blur-md text-white border border-white/20 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎈</span>
            <div>
              <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider block">
                Visitor Mode
              </span>
              <span className="text-sm font-bold">
                Touring {island.ownerName}'s Island
              </span>
            </div>
          </div>
          <button
            onClick={onReturnHome}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Fly Home
          </button>
        </div>
      )}

      {/* Island Action Toolbar (When on own island) */}
      {!isVisiting && (
        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
          <button
            onClick={onOpenWardrobe}
            className="w-10 h-10 rounded-2xl bg-white/85 dark:bg-slate-800/85 backdrop-blur-md text-slate-800 dark:text-slate-100 border border-white/40 dark:border-white/10 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
            title="Bean Wardrobe & Hat Customizer"
          >
            <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </button>

          <button
            onClick={onOpenShop}
            className="w-10 h-10 rounded-2xl bg-white/85 dark:bg-slate-800/85 backdrop-blur-md text-slate-800 dark:text-slate-100 border border-white/40 dark:border-white/10 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
            title="Seed & Furniture Shop"
          >
            <Home className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </button>

          <button
            onClick={onOpenFriends}
            className="w-10 h-10 rounded-2xl bg-white/85 dark:bg-slate-800/85 backdrop-blur-md text-slate-800 dark:text-slate-100 border border-white/40 dark:border-white/10 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
            title="Friends & Codes"
          >
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </button>

          <button
            onClick={onOpenMap}
            className="px-3.5 h-10 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition-all"
            title="Shared Sky Map"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Sky Map</span>
          </button>
        </div>
      )}

      {/* Island Nameplate */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 block drop-shadow-sm">
          {island.ownerName}'s Sanctuary
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
          {island.islandName || 'Floating Haven'}
        </h2>
      </div>

      {/* Main Interactive SVG Scene */}
      <div className="relative w-full aspect-[16/10] min-h-[380px] max-h-[540px]">
        <svg
          className="w-full h-full block"
          viewBox="0 0 1000 650"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#76cc5c" />
              <stop offset="70%" stopColor="#55ad3e" />
              <stop offset="100%" stopColor="#3d8f2b" />
            </linearGradient>

            <linearGradient id="cliffGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#695745" />
              <stop offset="50%" stopColor="#4e3f30" />
              <stop offset="100%" stopColor="#2c2219" />
            </linearGradient>

            <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="crystalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Drifting Background Clouds */}
          <g className="w-svg">
            <g className="cloud" style={{ '--d': '90s', animationDelay: '-10s' } as any}>
              <ellipse cx="200" cy="120" rx="90" ry="28" fill="url(#cloudGrad)" />
              <circle cx="160" cy="100" r="32" fill="url(#cloudGrad)" />
              <circle cx="230" cy="95" r="40" fill="url(#cloudGrad)" />
            </g>
            <g className="cloud" style={{ '--d': '120s', animationDelay: '-60s' } as any}>
              <ellipse cx="750" cy="180" rx="110" ry="34" fill="url(#cloudGrad)" />
              <circle cx="710" cy="155" r="38" fill="url(#cloudGrad)" />
              <circle cx="790" cy="160" r="46" fill="url(#cloudGrad)" />
            </g>
          </g>

          {/* Distant Orbiting Friend Islands */}
          <g opacity="0.65" transform="translate(820 110) scale(0.35)">
            <path d="M-80 50 C-100 90 -20 140 0 150 C20 140 100 90 80 50 Z" fill="#4e3f30" />
            <ellipse cx="0" cy="50" rx="80" ry="22" fill="#55ad3e" />
            <rect x="-18" y="16" width="36" height="34" rx="2" fill="#d9774a" />
            <polygon points="-24,18 0,-8 24,18" fill="#e5484d" />
          </g>

          {/* Floating Island Rock Base */}
          <g transform="translate(500 460)">
            {/* Hanging Roots & Earth */}
            <path
              d="M-380 -80 
                 C-400 10, -280 180, -140 220 
                 C-40 250, 40 250, 140 220 
                 C280 180, 400 10, 380 -80 
                 Z"
              fill="url(#cliffGrad)"
              stroke="#2c2219"
              strokeWidth="4"
            />

            {/* Glowing Celestial Crystals on the Rock Base */}
            <polygon points="-120,180 -105,140 -90,195 -105,210" fill="url(#crystalGrad)" opacity="0.9" />
            <polygon points="90,170 110,130 125,185 105,200" fill="url(#crystalGrad)" opacity="0.9" />

            {/* Waterfall cascading into sky clouds */}
            <path
              d="M-220 -70 C-225 -20 -210 80 -195 180 C-190 220 -200 240 -195 260"
              stroke="#67e8f9"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              opacity="0.85"
            />
          </g>

          {/* Island Green Surface */}
          <g transform="translate(500 370)">
            {/* Top Grass Disk */}
            <ellipse
              cx="0"
              cy="0"
              rx="400"
              ry="110"
              fill="url(#grassGrad)"
              stroke="#2d6e1e"
              strokeWidth="4"
            />

            {/* Cobblestone Path to Farmhouse */}
            <path
              d="M-20 80 C-40 40, -10 -10, 0 -60"
              stroke="#cbd5e1"
              strokeWidth="28"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="6 8"
            />

            {/* 1. Farmhouse Cabin */}
            <g transform="translate(0 -90)">
              {/* Chimney with Smoke */}
              <rect x="50" y="-80" width="18" height="42" rx="3" fill="#94a3b8" stroke="#334155" strokeWidth="2.5" />
              <g className="w-svg">
                <circle className="sm" cx="59" cy="-90" r="8" fill="#ffffff" style={{ animationDelay: '0s' }} />
                <circle className="sm" cx="59" cy="-90" r="10" fill="#ffffff" style={{ animationDelay: '1.2s' }} />
                <circle className="sm" cx="59" cy="-90" r="12" fill="#ffffff" style={{ animationDelay: '2.4s' }} />
              </g>

              {/* Cabin Walls */}
              <rect x="-85" y="-40" width="170" height="95" rx="6" fill="#fde68a" stroke="#78350f" strokeWidth="3.5" />

              {/* Roof (Level 1: Red Timber, Level 2: Slate, Level 3: Observatory Dome) */}
              {island.houseLevel >= 3 ? (
                /* Celestial Observatory Dome */
                <g>
                  <path d="M-95 -40 A95 95 0 0 1 95 -40 Z" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="4" />
                  <line x1="20" y1="-80" x2="60" y2="-120" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="60" cy="-120" r="8" fill="#fbbf24" stroke="#d9774a" strokeWidth="2" />
                </g>
              ) : (
                /* Classic Cozy Ghibli Roof */
                <polygon points="-100,-35 0,-105 100,-35" fill="#dc2626" stroke="#7f1d1d" strokeWidth="4" />
              )}

              {/* Glowing Warm Window */}
              <rect x="-55" y="-15" width="36" height="36" rx="4" fill="#fef08a" stroke="#78350f" strokeWidth="2.5" />
              <line x1="-37" y1="-15" x2="-37" y2="21" stroke="#78350f" strokeWidth="2" />
              <line x1="-55" y1="3" x2="-19" y2="3" stroke="#78350f" strokeWidth="2" />

              {/* Front Wooden Door */}
              <rect x="15" y="-5" width="32" height="60" rx="3" fill="#854d0e" stroke="#451a03" strokeWidth="2.5" />
              <circle cx="41" cy="25" r="3" fill="#f59e0b" />
            </g>

            {/* 2. Interactive Farm Garden (6 Soil Plots) */}
            <g transform="translate(-230 10)">
              {/* Garden Border Fence */}
              <rect x="-80" y="-50" width="160" height="110" rx="16" fill="rgba(120,53,15,0.15)" stroke="#78350f" strokeWidth="2" strokeDasharray="6 6" />

              {/* 6 Soil Plots */}
              {[
                { id: '0', x: -50, y: -30 },
                { id: '1', x: 0, y: -30 },
                { id: '2', x: 50, y: -30 },
                { id: '3', x: -50, y: 25 },
                { id: '4', x: 0, y: 25 },
                { id: '5', x: 50, y: 25 }
              ].map(slot => {
                const crop = crops.find(c => c.id === slot.id);
                const stage = crop ? crop.stage : 0;
                const isHarvestable = stage >= 3;

                return (
                  <g
                    key={slot.id}
                    transform={`translate(${slot.x} ${slot.y})`}
                    className="cursor-pointer group"
                    onClick={() => {
                      if (isVisiting) {
                        triggerSpeech("This is your friend's crop! You can look, but only the owner can harvest. 🌾");
                        return;
                      }
                      if (crop && isHarvestable) {
                        onHarvestCrop?.(slot.id);
                        confetti({
                          particleCount: 35,
                          spread: 70,
                          origin: { y: 0.6 }
                        });
                        triggerSpeech('Harvested golden crops! +XP and Seeds earned! 🌟');
                      } else if (!crop) {
                        onPlantCrop?.(slot.id);
                        triggerSpeech('Planted fresh seeds! Focus on studying to water them. 🌱');
                      } else {
                        triggerSpeech(`Crop is growing! Stage ${stage + 1}/4. Complete study sessions to water it. 💧`);
                      }
                    }}
                  >
                    {/* Tilled Mound of Earth */}
                    <ellipse cx="0" cy="0" rx="22" ry="10" fill="#583115" stroke="#3b1d09" strokeWidth="1.5" />

                    {/* Planted Crop Graphics based on Stage */}
                    {crop ? (
                      <g className="transition-transform group-hover:scale-110">
                        {stage === 0 && (
                          /* Stage 0: Little Green Seed Sprout */
                          <path d="M0 0 Q-5 -12 0 -16 Q5 -12 0 0" fill="#84cc16" stroke="#4d7c0f" strokeWidth="1.2" />
                        )}
                        {stage === 1 && (
                          /* Stage 1: Growing Stem with 2 Leaves */
                          <g>
                            <path d="M0 0 V-20" stroke="#4d7c0f" strokeWidth="2.5" />
                            <ellipse cx="-8" cy="-12" rx="7" ry="3.5" fill="#84cc16" transform="rotate(-25 -8 -12)" />
                            <ellipse cx="8" cy="-15" rx="7" ry="3.5" fill="#84cc16" transform="rotate(25 8 -15)" />
                          </g>
                        )}
                        {stage === 2 && (
                          /* Stage 2: Tall Plant with Bud */
                          <g>
                            <path d="M0 0 V-26" stroke="#4d7c0f" strokeWidth="3" />
                            <ellipse cx="-10" cy="-14" rx="8" ry="4" fill="#65a30d" transform="rotate(-25 -10 -14)" />
                            <ellipse cx="10" cy="-18" rx="8" ry="4" fill="#65a30d" transform="rotate(25 10 -18)" />
                            <circle cx="0" cy="-28" r="6" fill="#f43f5e" />
                          </g>
                        )}
                        {stage >= 3 && (
                          /* Stage 3: Golden Harvestable Crop with Star Burst */
                          <g>
                            <path d="M0 0 V-28" stroke="#ca8a04" strokeWidth="3.5" />
                            <circle cx="0" cy="-30" r="9" fill="#facc15" stroke="#eab308" strokeWidth="2" />
                            <circle cx="0" cy="-30" r="4" fill="#ffffff" />
                            <circle cx="0" cy="-30" r="14" fill="none" stroke="#facc15" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
                          </g>
                        )}
                      </g>
                    ) : (
                      /* Empty Plot prompt */
                      <text x="0" y="3" textAnchor="middle" fontSize="10" fill="#ca8a04" fontWeight="800">
                        +
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* 3. Bean Companion Area (Knitting by Fire Pit) */}
            <g transform="translate(190 20)">
              {/* Cozy Stone Fire Pit */}
              <ellipse cx="-45" cy="10" rx="20" ry="8" fill="#71717a" stroke="#27272a" strokeWidth="1.5" />
              <g className="w-svg">
                <polygon className="flame" points="-50,8 -45,-8 -40,8" fill="#f97316" />
                <polygon className="flame" points="-47,8 -44,-4 -41,8" fill="#facc15" />
              </g>

              {/* Sleeping Island Cat */}
              <g
                className={`cat ${catPurring ? 'purr' : ''}`}
                transform="translate(-25 18)"
                onClick={handleCatTap}
              >
                <ellipse cx="0" cy="-6" rx="14" ry="8" fill="#f97316" stroke="#c2410c" strokeWidth="1.5" />
                <circle cx="-12" cy="-8" r="6" fill="#f97316" stroke="#c2410c" strokeWidth="1.5" />
                <text x="4" y="-14" fontSize="10" fill="#94a3b8">z</text>
              </g>

              {/* Bean Animated Companion */}
              <g onClick={handleBeanTap} className="cursor-pointer">
                <ellipse cx="0" cy="18" rx="24" ry="6" fill="rgba(0,0,0,0.18)" />
                {/* Scaled Bean Vector */}
                <g transform="translate(0 15) scale(0.85)">
                  <BeanSvg mood="knit" size={90} />
                </g>
              </g>
            </g>

            {/* 4. Sky Dock with Hot Air Balloon */}
            <g transform="translate(300 30)">
              {/* Wooden Pier Sticking Out */}
              <rect x="-10" y="-8" width="50" height="16" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="2" />
              <line x1="38" y1="-8" x2="38" y2="28" stroke="#78350f" strokeWidth="4" />

              {/* Hot Air Balloon Basket & Dome */}
              <g
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  if (isVisiting) {
                    onReturnHome?.();
                  } else {
                    onOpenMap?.();
                  }
                }}
              >
                {/* Basket */}
                <rect x="25" y="-35" width="22" height="18" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="2" />
                <line x1="28" y1="-35" x2="22" y2="-55" stroke="#78350f" strokeWidth="1.5" />
                <line x1="44" y1="-35" x2="50" y2="-55" stroke="#78350f" strokeWidth="1.5" />

                {/* Striped Balloon Envelope */}
                <g transform="translate(36 -95)">
                  <path d="M-28 0 C-36 -45 36 -45 28 0 C22 18 10 32 0 40 C-10 32 -22 18 -28 0 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="2.5" />
                  <path d="M-12 0 C-16 -45 16 -45 12 0 C9 18 4 32 0 40 C-4 32 -9 18 -12 0 Z" fill="#facc15" />
                </g>
              </g>
            </g>
          </g>

          {/* Speech Dialogue Bubble */}
          {showSpeech && (
            <g transform="translate(500 240)">
              <rect
                x={-Math.max(120, speech.length * 8 + 30) / 2}
                y="-36"
                width={Math.max(120, speech.length * 8 + 30)}
                height="44"
                rx="22"
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth="3"
                filter="drop-shadow(0 6px 12px rgba(0,0,0,0.15))"
              />
              <text y="-8" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">
                {speech}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Island Status Footer Bar */}
      <div className="flex items-center justify-between p-3.5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 text-xs font-semibold">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Droplets className="w-4 h-4 fill-current" />
            <span>{studyMinutesToday} mins study water today</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Farmhouse Lv {island.houseLevel}</span>
          </div>
        </div>

        <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
          Tap crops to harvest or plant 🌱
        </span>
      </div>
    </div>
  );
};

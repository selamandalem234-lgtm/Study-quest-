import React, { useState } from 'react';
import { X, Sparkles, Home, ShoppingBag, Check } from 'lucide-react';
import { DECOR } from '../constants.ts';

interface FarmShopModalProps {
  socks: number;
  houseLevel: number;
  decor: Record<string, boolean>;
  onBuySeeds: (type: 'wheat' | 'starberry' | 'moonblossom' | 'sunflower', cost: number) => void;
  onUpgradeHouse: (newLevel: number, cost: number) => void;
  onBuyDecor: (id: string, cost: number, name: string) => void;
  onClose: () => void;
}

const SEED_TYPES = [
  { id: 'wheat', name: 'Golden Wheat', emoji: '🌾', cost: 1, mins: '10 min', desc: 'Fast-growing classic crop.' },
  { id: 'starberry', name: 'Sweet Starberry', emoji: '🍓', cost: 2, mins: '20 min', desc: 'Glows in the dusk sky.' },
  { id: 'moonblossom', name: 'Moon Blossom', emoji: '🌙', cost: 3, mins: '25 min', desc: 'Luminescent night petal.' },
  { id: 'sunflower', name: 'Sunburst Flower', emoji: '🌻', cost: 4, mins: '30 min', desc: 'Brimming with golden light.' }
];

export const FarmShopModal: React.FC<FarmShopModalProps> = ({
  socks,
  houseLevel,
  decor,
  onBuySeeds,
  onUpgradeHouse,
  onBuyDecor,
  onClose
}) => {
  const [tab, setTab] = useState<'seeds' | 'house' | 'decor'>('seeds');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 flex flex-col gap-5 shadow-2xl border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Island Supply Shop
              </h3>
              <p className="text-xs text-slate-500">
                Spend knitted socks on seeds, decor & house expansions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold">
              🧦 {socks}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
          <button
            onClick={() => setTab('seeds')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'seeds' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            🌱 Seeds
          </button>
          <button
            onClick={() => setTab('house')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'house' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            🏡 House
          </button>
          <button
            onClick={() => setTab('decor')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'decor' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            🛋️ Decor
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
          {tab === 'seeds' &&
            SEED_TYPES.map(seed => (
              <div
                key={seed.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{seed.emoji}</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {seed.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 block">
                      {seed.desc} ({seed.mins})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onBuySeeds(seed.id as any, seed.cost)}
                  disabled={socks < seed.cost}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs"
                >
                  🧦 {seed.cost}
                </button>
              </div>
            ))}

          {tab === 'house' && (
            <div className="flex flex-col gap-3">
              {/* Level 2 Upgrade */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Level 2: Stone Cottage & Chimney
                  </h4>
                  <span className="text-[10px] text-slate-500 block">
                    Sturdy brick hearth with cozy winter smoke.
                  </span>
                </div>
                {houseLevel >= 2 ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Owned
                  </span>
                ) : (
                  <button
                    onClick={() => onUpgradeHouse(2, 8)}
                    disabled={socks < 8}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs"
                  >
                    🧦 8
                  </button>
                )}
              </div>

              {/* Level 3 Upgrade */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Level 3: Celestial Observatory
                  </h4>
                  <span className="text-[10px] text-slate-500 block">
                    Brass telescope dome for studying the sky constellations.
                  </span>
                </div>
                {houseLevel >= 3 ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Owned
                  </span>
                ) : (
                  <button
                    onClick={() => onUpgradeHouse(3, 15)}
                    disabled={socks < 15}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs"
                  >
                    🧦 15
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === 'decor' &&
            DECOR.map(d => {
              const owned = !!decor[d.id];
              return (
                <div
                  key={d.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {d.n}
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      Cozy furniture for your island meadow.
                    </span>
                  </div>

                  {owned ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Owned
                    </span>
                  ) : (
                    <button
                      onClick={() => onBuyDecor(d.id, d.c, d.n)}
                      disabled={socks < d.c}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs"
                    >
                      🧦 {d.c}
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

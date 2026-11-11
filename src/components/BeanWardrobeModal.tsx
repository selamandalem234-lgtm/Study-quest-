import React, { useState } from 'react';
import { BeanSvg } from './BeanSvg.tsx';
import { X, Check, Sparkles } from 'lucide-react';

interface BeanWardrobeModalProps {
  currentOutfit: {
    color: string;
    hat: string;
    accessory: string;
  };
  onSaveOutfit: (outfit: { color: string; hat: string; accessory: string }) => void;
  onClose: () => void;
}

const HATS = [
  { id: 'beanie', name: 'Cozy Beanie', emoji: '🧣' },
  { id: 'straw', name: 'Farmer Straw Hat', emoji: '👒' },
  { id: 'crown', name: 'Golden Crown', emoji: '👑' },
  { id: 'scholar', name: 'Graduate Cap', emoji: '🎓' },
  { id: 'wizard', name: 'Wizard Hat', emoji: '🧙' },
  { id: 'flower', name: 'Flower Wreath', emoji: '🌸' }
];

const COLORS = [
  { id: '#eaae70', name: 'Warm Caramel' },
  { id: '#86efac', name: 'Matcha Green' },
  { id: '#fbcfe8', name: 'Pastel Peach' },
  { id: '#7dd3fc', name: 'Sky Dew' },
  { id: '#fde047', name: 'Golden Sun' },
  { id: '#c4b5fd', name: 'Lavender Mist' }
];

export const BeanWardrobeModal: React.FC<BeanWardrobeModalProps> = ({
  currentOutfit,
  onSaveOutfit,
  onClose
}) => {
  const [selectedHat, setSelectedHat] = useState(currentOutfit.hat || 'beanie');
  const [selectedColor, setSelectedColor] = useState(currentOutfit.color || '#eaae70');

  const handleSave = () => {
    onSaveOutfit({
      color: selectedColor,
      hat: selectedHat,
      accessory: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-sm glass-card rounded-3xl p-6 flex flex-col gap-5 shadow-2xl border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👒</span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Bean’s Wardrobe
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview */}
        <div className="flex flex-col items-center justify-center py-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/50 dark:border-amber-900/30">
          <BeanSvg mood="happy" size={110} />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
            Looking dapper! ✨
          </span>
        </div>

        {/* Hats Picker */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Choose a Hat
          </span>
          <div className="grid grid-cols-3 gap-2">
            {HATS.map(h => (
              <button
                key={h.id}
                onClick={() => setSelectedHat(h.id)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                  selectedHat === h.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-lg">{h.emoji}</span>
                <span className="text-[10px] leading-tight text-center">{h.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Colors Picker */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Bean Body Color
          </span>
          <div className="flex items-center justify-between gap-2">
            {COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedColor(c.id)}
                style={{ backgroundColor: c.id }}
                className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                  selectedColor === c.id ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-black/10'
                }`}
                title={c.name}
              >
                {selectedColor === c.id && <Check className="w-4 h-4 text-slate-900 stroke-[3]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={handleSave}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
        >
          <Check className="w-4 h-4" /> Save Outfit
        </button>
      </div>
    </div>
  );
};

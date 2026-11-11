import React from 'react';
import { Compass, X, ArrowRight, Flame, UserCheck, Sparkles } from 'lucide-react';

export interface SkyFriendIsland {
  id: string;
  ownerName: string;
  islandName: string;
  streak: number;
  houseLevel: number;
  cropCount: number;
  x: number;
  y: number;
}

interface WorldSkyMapProps {
  currentUserId: string;
  currentUserName: string;
  friendsIslands: SkyFriendIsland[];
  onSelectIsland: (islandId: string) => void;
  onClose: () => void;
}

export const WorldSkyMap: React.FC<WorldSkyMapProps> = ({
  currentUserId,
  currentUserName,
  friendsIslands,
  onSelectIsland,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-2xl glass-card rounded-3xl p-6 flex flex-col gap-5 shadow-2xl border border-white/20 relative overflow-hidden bg-gradient-to-b from-indigo-950/90 to-slate-950/90 text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">
                Celestial Sky Archipelago
              </h3>
              <p className="text-xs text-slate-400">
                Explore floating islands across the shared study universe
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 -mr-1 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Constellation Sky Canvas */}
        <div className="relative w-full aspect-[16/9] min-h-[260px] rounded-2xl bg-indigo-950/40 border border-white/10 overflow-hidden flex items-center justify-center p-4">
          {/* Background Nebula & Stars */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Home Island (Center) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-10 group cursor-default">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
                <span className="text-2xl">🏡</span>
              </div>
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-[9px] font-extrabold uppercase">
                Home
              </span>
            </div>
            <span className="text-xs font-bold text-blue-200">
              {currentUserName}'s Island
            </span>
          </div>

          {/* Orbiting Friend Islands */}
          {friendsIslands.length > 0 ? (
            friendsIslands.map((friend, idx) => {
              // Pre-calculated orbital positions
              const positions = [
                { top: '20%', left: '22%' },
                { top: '25%', right: '20%' },
                { bottom: '22%', left: '26%' },
                { bottom: '20%', right: '22%' },
                { top: '15%', left: '50%' }
              ];
              const pos = positions[idx % positions.length];

              return (
                <div
                  key={friend.id}
                  style={pos as any}
                  onClick={() => onSelectIsland(friend.id)}
                  className="absolute flex flex-col items-center gap-1 cursor-pointer group hover:scale-110 active:scale-95 transition-all z-20"
                >
                  <div className="w-13 h-13 rounded-full bg-amber-500/20 group-hover:bg-amber-500/40 border-2 border-amber-400/80 flex items-center justify-center shadow-md shadow-amber-500/20">
                    <span className="text-xl">🎈</span>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <span className="text-[11px] font-extrabold text-amber-200 group-hover:text-white flex items-center gap-1">
                      {friend.ownerName}
                      <Flame className="w-3 h-3 text-orange-400 fill-current" />
                      <span className="text-[10px]">{friend.streak}d</span>
                    </span>
                    <span className="text-[9px] text-slate-400">
                      Lv {friend.houseLevel} Cottage
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center z-10 p-4 max-w-sm">
              <span className="text-3xl block mb-2">🔭</span>
              <p className="text-xs text-slate-300 font-medium">
                No friend islands in sight yet! Share your Friend Code or add classmates to visit their sky farms.
              </p>
            </div>
          )}
        </div>

        {/* Islands Quick List */}
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Available Friend Islands
          </span>

          {friendsIslands.map(f => (
            <div
              key={f.id}
              onClick={() => onSelectIsland(f.id)}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏝️</span>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {f.ownerName}’s Island
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-extrabold">
                      🔥 {f.streak} days
                    </span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    {f.cropCount} crops growing · House Lv {f.houseLevel}
                  </span>
                </div>
              </div>

              <button className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1">
                Visit <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

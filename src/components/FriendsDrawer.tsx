import React, { useState } from 'react';
import { Users, X, Copy, Check, Plus, ArrowRight, Flame } from 'lucide-react';

export interface FriendEntry {
  uid: string;
  displayName: string;
  friendCode: string;
  streak: number;
  houseLevel: number;
}

interface FriendsDrawerProps {
  friendCode: string;
  friends: FriendEntry[];
  onAddFriend: (code: string) => Promise<boolean>;
  onVisitFriend: (friendUid: string) => void;
  onClose: () => void;
}

export const FriendsDrawer: React.FC<FriendsDrawerProps> = ({
  friendCode,
  friends,
  onAddFriend,
  onVisitFriend,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(friendCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setFeedback(null);
    try {
      const ok = await onAddFriend(code);
      if (ok) {
        setFeedback('Friend added to your sky map! 🎉');
        setInputCode('');
      } else {
        setFeedback('Friend code not found. Check the code and try again.');
      }
    } catch (e) {
      setFeedback('Error connecting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 flex flex-col gap-5 shadow-2xl border border-white/20">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Friends & Sky Islands
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Study together and visit each other’s farms
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Your Friend Code Card */}
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
              Your Unique Friend Code
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-widest font-mono">
              {friendCode}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>

        {/* Add Friend Form */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Add a Friend by Code
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. BEAN-492"
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              className="flex-1 h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono uppercase tracking-wider"
            />
            <button
              onClick={handleAdd}
              disabled={loading || !inputCode.trim()}
              className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs disabled:opacity-50 flex items-center gap-1 transition-all"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {feedback && (
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
              {feedback}
            </p>
          )}
        </div>

        {/* Friends List */}
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Your Friends ({friends.length})
          </span>

          {friends.length > 0 ? (
            friends.map(f => (
              <div
                key={f.uid}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold text-xs">
                    🫘
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      {f.displayName}
                      <Flame className="w-3 h-3 text-orange-500 fill-current" />
                      <span className="text-[10px] text-orange-600 dark:text-orange-400">
                        {f.streak}d
                      </span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {f.friendCode}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onVisitFriend(f.uid)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                >
                  Visit <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 font-medium">
              You haven't added any study friends yet. Share your code above to study together!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { TimerState, Subject } from '../types.ts';
import { BeanSvg } from './BeanSvg.tsx';
import { fmtTime, countFor } from '../constants.ts';
import { Play, Pause, X, Check, Award, ArrowRight, BookOpen, Coffee } from 'lucide-react';

interface FocusSheetProps {
  timer: TimerState;
  subject: Subject;
  quarter: number;
  lastStudied: number;
  totalSocks: number;
  onPauseToggle: () => void;
  onFinishEarly: () => void;
  onCancel: () => void;
  onLogPages: (pages: number) => void;
  onSaveExactPage: (page: number) => void;
  onNextRound: () => void;
  onStartBreak: () => void;
  onSkipBreak: () => void;
  onSwitchSubject: () => void;
  onClose: () => void;
  onStartQuiz: () => void;
}

export const FocusSheet: React.FC<FocusSheetProps> = ({
  timer,
  subject,
  quarter,
  lastStudied,
  totalSocks,
  onPauseToggle,
  onFinishEarly,
  onCancel,
  onLogPages,
  onSaveExactPage,
  onNextRound,
  onStartBreak,
  onSkipBreak,
  onSwitchSubject,
  onClose,
  onStartQuiz
}) => {
  const [now, setNow] = useState(Date.now());
  const [exactPageInput, setExactPageInput] = useState<string>('');

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const r = (subject.ranges && subject.ranges[quarter - 1]) || subject.ranges?.[0] || [1, 50];
  const totalPortion = countFor(r);
  const isFinished = lastStudied >= r[1];

  const leftMs =
    timer.stage === 'running'
      ? Math.max(0, (timer.endsAt || 0) - now)
      : timer.left || 0;

  const pct = Math.max(0, Math.min(100, (leftMs / timer.total) * 100));

  // Determine Bean Mood
  const isBreak = timer.phase === 'break';
  const isPaused = timer.stage === 'paused';
  const isSad = timer.sadUntil > now;

  let mood: 'knit' | 'tea' | 'sleep' | 'sad' | 'happy' = 'knit';
  if (isBreak) mood = 'tea';
  else if (isPaused) mood = 'sleep';
  else if (isSad) mood = 'sad';

  const goalDesc =
    timer.goalA === timer.goalB
      ? `page ${timer.goalA}`
      : `pages ${timer.goalA} to ${timer.goalB}`;

  const goalN = Math.max(1, timer.goalB - timer.goalA + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl border border-white/40 dark:border-white/10 relative overflow-hidden">
        {/* Top Bar inside sheet */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{isBreak ? '☕' : subject.emoji}</span>
            <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">
              {isBreak
                ? 'Break Time'
                : timer.mode === 'pomodoro'
                ? `Pomodoro Round ${timer.round}`
                : `${subject.name} Focus`}
              {isPaused && ' (Paused)'}
            </span>
          </div>
          <button
            onClick={onCancel}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
            title="Cancel timer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Running / Paused Stage */}
        {timer.stage !== 'done' ? (
          <>
            {/* Bean Companion in focus */}
            <div className="flex flex-col items-center justify-center text-center py-2">
              <BeanSvg mood={mood} size={130} />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2">
                {isBreak
                  ? 'Bean is enjoying a warm cup of tea.'
                  : isPaused
                  ? 'Bean is taking a quick nap while you pause.'
                  : isSad
                  ? 'Bean noticed you left the tab! 🥺 Stay with it.'
                  : 'Bean is diligently knitting you a sock. Keep focusing!'}
              </p>
              {timer.slips > 0 && !isBreak && (
                <span className="text-[11px] text-rose-500 font-medium mt-0.5">
                  Left tab {timer.slips} time{timer.slips === 1 ? '' : 's'} (fewer bonus socks)
                </span>
              )}
            </div>

            {/* Apple Big Clock */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="text-6xl sm:text-7xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white font-mono">
                {fmtTime(leftMs)}
              </div>

              {/* Smooth Progress Bar */}
              <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-linear"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                {isBreak
                  ? 'Stretch, drink some water, and relax your eyes.'
                  : `Aim for ${goalDesc}. You can pause or stop when done.`}
              </p>
            </div>

            {/* Interactive Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={onPauseToggle}
                className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
              >
                {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>

              {isBreak ? (
                <button
                  onClick={onSkipBreak}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  Skip Break
                </button>
              ) : (
                <button
                  onClick={onFinishEarly}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Check className="w-5 h-5" />
                  Finish Early
                </button>
              )}
            </div>
          </>
        ) : (
          /* Completion Celebration Stage */
          <div className="flex flex-col gap-5 text-center">
            {/* Header / Celebration */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shadow-lg">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {timer.full ? 'Focus Round Complete! 🎉' : 'Session Saved'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Logged {timer.mins} minute{timer.mins === 1 ? '' : 's'} of study.
              </p>
            </div>

            {/* Socks & Bean Reward Banner */}
            {timer.full && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center gap-3">
                <span className="text-2xl">🧦</span>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Bean knitted {timer.socks || 0} sock{timer.socks === 1 ? '' : 's'} for you! (Total: {totalSocks})
                </span>
              </div>
            )}

            {/* Reward snack / break suggestion */}
            {timer.reward && (
              <div className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/30">
                🎁 Reward time: <strong>{timer.reward}</strong>
              </div>
            )}

            {/* Quick Page Logger Box */}
            <div className="text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Log your progress for {subject.name}
                </span>
                <span className="text-[11px] text-slate-400">
                  Currently on page {lastStudied} of {r[1]}
                </span>
              </div>

              {!isFinished ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onLogPages(goalN)}
                      className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> +{goalN} Goal
                    </button>
                    <button
                      onClick={() => onLogPages(5)}
                      className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs"
                    >
                      +5 Pages
                    </button>
                    <button
                      onClick={() => onLogPages(10)}
                      className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs"
                    >
                      +10 Pages
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      placeholder={`Exact page (max ${r[1]})`}
                      value={exactPageInput}
                      onChange={e => setExactPageInput(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    />
                    <button
                      onClick={() => {
                        const n = Number(exactPageInput);
                        if (Number.isInteger(n) && n >= 0 && n <= r[1]) {
                          onSaveExactPage(n);
                          setExactPageInput('');
                        }
                      }}
                      className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold"
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-2 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                  🎉 {subject.name} is 100% finished for this exam portion!
                </div>
              )}
            </div>

            {/* Next Actions */}
            <div className="flex flex-col gap-2 pt-1">
              {timer.mode === 'pomodoro' ? (
                <button
                  onClick={onStartBreak}
                  className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Coffee className="w-5 h-5" /> Take 5-Min Break
                </button>
              ) : (
                <button
                  onClick={onNextRound}
                  className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <ArrowRight className="w-5 h-5" /> Keep Going (10 More Min)
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onStartQuiz}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" /> Quiz Me on These Pages
                </button>
                <button
                  onClick={onSwitchSubject}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Switch Subject
                </button>
              </div>

              <button
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-1"
              >
                I’m done for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ExamRecord } from '../types.ts';
import {
  Calendar,
  Clock,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Check,
  X,
  Flame,
  Trophy,
  BookOpen,
  GraduationCap,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

interface ExamCountdownWidgetProps {
  activeExam: ExamRecord;
  allExams: Record<string, ExamRecord>;
  onSwitchExam: (examId: string) => void;
  onUpdateExamDate: (examId: string, newDate: string) => void;
  overallRemainingPages: number;
  overallTotalPages: number;
  overallCoveredPages: number;
  overallPercent: number;
  streakCount: number;
}

export const ExamCountdownWidget: React.FC<ExamCountdownWidgetProps> = ({
  activeExam,
  allExams,
  onSwitchExam,
  onUpdateExamDate,
  overallRemainingPages,
  overallTotalPages,
  overallCoveredPages,
  overallPercent,
  streakCount
}) => {
  const [isEditingDate, setIsEditingDate] = useState<boolean>(false);
  const [tempDate, setTempDate] = useState<string>(activeExam.date || '');

  // Calculate dynamic days and weeks remaining
  const targetDateStr = activeExam.date || '';
  const [y, m, d] = targetDateStr.split('-').map(Number);
  const targetDate = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0);

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const diffMs = targetDate.getTime() - todayMidnight.getTime();
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const weeksRemaining = Math.floor(Math.max(0, daysRemaining) / 7);
  const remainingExtraDays = Math.max(0, daysRemaining) % 7;

  // Clean formatted date string (e.g. "Tue, Dec 15, 2026")
  const formattedDate = targetDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Urgency status
  const isPast = daysRemaining < 0;
  const isToday = daysRemaining === 0;
  const isTomorrow = daysRemaining === 1;
  const isUrgent = daysRemaining > 1 && daysRemaining <= 7;

  // Study pacing calculation: pages per day required to complete portion on time
  const validStudyDays = Math.max(1, daysRemaining);
  const pagesPerDayNeeded = Math.ceil(overallRemainingPages / validStudyDays);

  // Exam Theme Styling: Muted Sage Green (FQT), Warm Terracotta (Test 2), Deep Walnut/Plum (FE)
  const isTest2 = activeExam.id === 'test2';
  const isFqt = activeExam.id === 'fqt';
  const isFe = activeExam.id === 'fe';

  const themeConfig = isFqt
    ? {
        name: 'First Quarter Test',
        code: 'FQT',
        pillBg: 'bg-[#4F6F52]',
        badgeBg: 'bg-[#E8EFE8] dark:bg-[#233325] text-[#335336] dark:text-[#A3CCA6] border-[#D5E2D4] dark:border-[#2F4732]',
        gradient: 'from-[#4F6F52] to-[#3B543D]',
        lightBg: 'bg-[#F9FBF8] dark:bg-[#1E231F]',
        borderColor: 'border-[#DCE7DB] dark:border-[#2E3C30]',
        accentText: 'text-[#4F6F52] dark:text-[#A3CCA6]',
        glow: 'shadow-[0_4px_20px_-4px_rgba(79,111,82,0.12)]',
        icon: Flame
      }
    : isFe
    ? {
        name: 'Final Examination',
        code: 'FE',
        pillBg: 'bg-[#735548]',
        badgeBg: 'bg-[#F3EBE7] dark:bg-[#2D2421] text-[#5D4037] dark:text-[#D7CCC8] border-[#E2D2CB] dark:border-[#42332D]',
        gradient: 'from-[#735548] to-[#5D4037]',
        lightBg: 'bg-[#FAF7F5] dark:bg-[#241E1C]',
        borderColor: 'border-[#EADFD9] dark:border-[#3D302A]',
        accentText: 'text-[#735548] dark:text-[#D7CCC8]',
        glow: 'shadow-[0_4px_20px_-4px_rgba(115,85,72,0.12)]',
        icon: Trophy
      }
    : {
        name: 'Second Quarter Test',
        code: 'Test 2',
        pillBg: 'bg-[#C15C3D]',
        badgeBg: 'bg-[#F9EBE6] dark:bg-[#341F18] text-[#9A381A] dark:text-[#F3AB94] border-[#F2D0C6] dark:border-[#4B2920]',
        gradient: 'from-[#C15C3D] to-[#9A381A]',
        lightBg: 'bg-[#FAF6F3] dark:bg-[#231B18]',
        borderColor: 'border-[#ECDCD5] dark:border-[#3F2B23]',
        accentText: 'text-[#C15C3D] dark:text-[#E07A5F]',
        glow: 'shadow-[0_4px_20px_-4px_rgba(193,92,61,0.12)]',
        icon: Target
      };

  const ThemeIcon = themeConfig.icon;

  const handleSaveDate = () => {
    if (tempDate) {
      onUpdateExamDate(activeExam.id, tempDate);
    }
    setIsEditingDate(false);
  };

  return (
    <div
      className={`journal-card rounded-3xl p-5 sm:p-7 border ${themeConfig.borderColor} ${themeConfig.lightBg} relative overflow-hidden transition-all duration-300 ${themeConfig.glow}`}
    >
      <div className="flex flex-col gap-6 relative z-10">
        {/* Top Header: Exam Switcher Ribbon & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${themeConfig.gradient} text-white flex items-center justify-center shadow-md ${themeConfig.glow}`}
            >
              <ThemeIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6E6256] dark:text-[#ACA195]">
                  Exam Countdown
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${themeConfig.badgeBg}`}
                >
                  {themeConfig.code}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6] tracking-tight">
                {activeExam.name}
              </h3>
            </div>
          </div>

          {/* Quick-switch buttons between strictly the 3 allowed exams */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E] self-start sm:self-auto">
            {(['fqt', 'test2', 'fe'] as const).map(examKey => {
              const ex = allExams[examKey];
              if (!ex) return null;
              const isSelected = activeExam.id === examKey;
              return (
                <button
                  key={examKey}
                  type="button"
                  onClick={() => onSwitchExam(examKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isSelected
                      ? `${themeConfig.pillBg} text-white shadow-sm shadow-black/20`
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`Switch active countdown to ${ex.name}`}
                >
                  {ex.shortName || ex.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Countdown Hero Display */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Large Countdown Digit & Urgency Banner */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left p-5 rounded-2xl bg-white/90 dark:bg-[#24201D]/90 border border-[#EAE4D9] dark:border-[#38312B] shadow-xs">
            {isToday ? (
              <div className="flex flex-col items-center md:items-start gap-1 py-1">
                <span className="text-4xl sm:text-5xl font-serif font-bold text-[#4F6F52] dark:text-[#A3CCA6] animate-bounce">
                  TODAY! 🎯
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-[#6E6256] dark:text-[#ACA195]">
                  Examination Day
                </span>
                <p className="text-xs text-[#6E6256] dark:text-[#ACA195] mt-1 font-medium">
                  Take a deep breath. You studied hard and Bean believes in you! 🌟
                </p>
              </div>
            ) : isTomorrow ? (
              <div className="flex flex-col items-center md:items-start gap-1 py-1">
                <span className="text-5xl sm:text-6xl font-serif font-bold text-[#C15C3D] dark:text-[#E07A5F]">
                  1
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-[#2B2118] dark:text-[#F4EFE6]">
                  DAY REMAINING · TOMORROW!
                </span>
                <p className="text-xs text-[#6E6256] dark:text-[#ACA195] mt-0.5">
                  Final light review today. Get a good night's sleep tonight! 🌙
                </p>
              </div>
            ) : isPast ? (
              <div className="flex flex-col items-center md:items-start gap-1 py-1">
                <span className="text-3xl sm:text-4xl font-serif font-bold text-[#ACA195]">
                  COMPLETED
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6E6256]">
                  Exam Date Was {Math.abs(daysRemaining)} Days Ago
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingDate(true)}
                  className="mt-2 text-xs font-bold text-[#C15C3D] dark:text-[#E07A5F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> Set Next Examination Date
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center md:items-start gap-0.5">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-6xl sm:text-7xl font-serif font-bold tracking-tight ${themeConfig.accentText}`}
                  >
                    {daysRemaining}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6] uppercase tracking-wider">
                      Days
                    </span>
                    <span className="text-[11px] font-bold text-[#6E6256] dark:text-[#ACA195] uppercase tracking-widest">
                      Remaining
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-[#6E6256] dark:text-[#ACA195] font-semibold">
                  <Clock className="w-3.5 h-3.5 text-[#ACA195]" />
                  <span>
                    {weeksRemaining > 0
                      ? `${weeksRemaining} ${weeksRemaining === 1 ? 'week' : 'weeks'}${
                          remainingExtraDays > 0
                            ? `, ${remainingExtraDays} ${remainingExtraDays === 1 ? 'day' : 'days'}`
                            : ''
                        } left`
                      : `${daysRemaining} days until test`}
                  </span>
                </div>

                {isUrgent && (
                  <span className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F9EBE6] dark:bg-[#341F18] text-[#C15C3D] dark:text-[#E07A5F] border border-[#F2D0C6] dark:border-[#4B2920]">
                    <Flame className="w-3.5 h-3.5 text-[#C15C3D]" />
                    Final Sprint Week!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Metrics Grid: Target Date, Daily Pace, Portion Progress */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Target Date Card (Editable) */}
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#24201D]/90 border border-[#EAE4D9] dark:border-[#38312B] flex flex-col justify-between gap-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6E6256] dark:text-[#ACA195] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Target Date
                </span>
                {!isEditingDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempDate(activeExam.date || '');
                      setIsEditingDate(true);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Change exam target date"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {isEditingDate ? (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="date"
                    value={tempDate}
                    onChange={e => setTempDate(e.target.value)}
                    className="h-8 px-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleSaveDate}
                    className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer"
                    title="Save date"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingDate(false)}
                    className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <span className="text-sm sm:text-base font-bold text-[#2B2118] dark:text-[#F4EFE6] block">
                    {formattedDate}
                  </span>
                  <span className="text-[11px] text-[#6E6256] dark:text-[#ACA195]">
                    {themeConfig.name}
                  </span>
                </div>
              )}
            </div>

            {/* Daily Pace Target Card */}
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#24201D]/90 border border-[#EAE4D9] dark:border-[#38312B] flex flex-col justify-between gap-1 shadow-xs">
              <span className="text-xs font-semibold text-[#6E6256] dark:text-[#ACA195] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#6E6256]" />
                Required Study Pace
              </span>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl sm:text-2xl font-serif font-bold ${themeConfig.accentText}`}>
                    {overallRemainingPages === 0 ? '0' : pagesPerDayNeeded}
                  </span>
                  <span className="text-xs font-semibold text-[#6E6256] dark:text-[#ACA195]">
                    pages / day
                  </span>
                </div>
                <span className="text-[11px] text-[#6E6256] dark:text-[#ACA195]">
                  {overallRemainingPages === 0
                    ? 'All portions finished! 🎉'
                    : `To finish ${overallRemainingPages} pages on time`}
                </span>
              </div>
            </div>

            {/* Overall Portion Progress Card (Spans across both columns on sm screens) */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-white/90 dark:bg-[#24201D]/90 border border-[#EAE4D9] dark:border-[#38312B] flex flex-col gap-2.5 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#2B2118] dark:text-[#F4EFE6] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#6E6256]" />
                  Portion Coverage for {themeConfig.code}
                </span>
                <span className={`font-bold ${themeConfig.accentText}`}>
                  {overallPercent}% ({overallCoveredPages}/{overallTotalPages} pages)
                </span>
              </div>

              {/* Progress bar track */}
              <div className="w-full h-2 rounded-full bg-[#EAE4D9] dark:bg-[#38312B] overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${themeConfig.gradient} transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, overallPercent))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6E6256] dark:text-[#ACA195]">
                <span>
                  {activeExam.subjects?.length || 0} subjects enrolled in this exam
                </span>
                <span>
                  {overallRemainingPages} pages left
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

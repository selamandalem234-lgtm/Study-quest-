import React, { useState } from 'react';
import { Subject, ExamPeriod } from '../types.ts';
import { GRADE_OPTIONS, getDefaultSubjectsForGrade, DEFAULT_EXAM_PERIODS } from '../constants.ts';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Edit2
} from 'lucide-react';

interface GradeSetupModalProps {
  currentGrade: string;
  currentExamPeriodId: string;
  currentExamPeriods: ExamPeriod[];
  currentSubjects: Subject[];
  targetDate: string;
  onSave: (setup: {
    grade: string;
    examPeriodId: string;
    examPeriods: ExamPeriod[];
    subjects: Subject[];
    targetDate: string;
  }) => void;
  onClose: () => void;
  isInitialSetup?: boolean;
}

export const GradeSetupModal: React.FC<GradeSetupModalProps> = ({
  currentGrade,
  currentExamPeriodId,
  currentExamPeriods,
  currentSubjects,
  targetDate,
  onSave,
  onClose,
  isInitialSetup = false
}) => {
  const [selectedGrade, setSelectedGrade] = useState<string>(currentGrade || 'Grade 10');
  const [customGradeInput, setCustomGradeInput] = useState<string>('');
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>(
    currentExamPeriods && currentExamPeriods.length > 0 ? currentExamPeriods : DEFAULT_EXAM_PERIODS
  );
  const [activeExamId, setActiveExamId] = useState<string>(currentExamPeriodId || 'q2');
  const [activeDate, setActiveDate] = useState<string>(
    targetDate || examPeriods.find(e => e.id === (currentExamPeriodId || 'q2'))?.date || '2026-12-15'
  );
  const [subjectsList, setSubjectsList] = useState<Subject[]>(
    currentSubjects && currentSubjects.length > 0 ? currentSubjects : getDefaultSubjectsForGrade(selectedGrade)
  );

  // New Subject Inline Form
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubEmoji, setNewSubEmoji] = useState('📘');
  const [newSubStart, setNewSubStart] = useState('1');
  const [newSubEnd, setNewSubEnd] = useState('50');

  // New Exam Inline Form
  const [showAddExam, setShowAddExam] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamDate, setNewExamDate] = useState('');

  // When grade selection changes, offer to load preset subjects if user wants
  const handleGradeChange = (newGrade: string) => {
    setSelectedGrade(newGrade);
    const presets = getDefaultSubjectsForGrade(newGrade);
    setSubjectsList(presets);
  };

  const handleUpdateSubjectRange = (index: number, start: number, end: number) => {
    setSubjectsList(prev =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const newRanges = [...s.ranges];
        if (newRanges.length === 0) {
          newRanges.push([start, end]);
        } else {
          newRanges[0] = [start, end];
        }
        return { ...s, ranges: newRanges };
      })
    );
  };

  const handleDeleteSubject = (index: number) => {
    if (subjectsList.length <= 1) {
      alert('You need at least one subject in your study quest!');
      return;
    }
    setSubjectsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateSubject = () => {
    if (!newSubName.trim()) return;
    const start = Math.max(1, parseInt(newSubStart, 10) || 1);
    const end = Math.max(start, parseInt(newSubEnd, 10) || start + 25);
    const newSub: Subject = {
      name: newSubName.trim(),
      emoji: newSubEmoji || '📖',
      hue: Math.floor(Math.random() * 360),
      ranges: [[start, end]]
    };
    setSubjectsList(prev => [...prev, newSub]);
    setNewSubName('');
    setNewSubStart('1');
    setNewSubEnd('50');
    setShowAddSubject(false);
  };

  const handleCreateExam = () => {
    if (!newExamName.trim()) return;
    const id = `exam-${Date.now().toString(36)}`;
    const newEx: ExamPeriod = {
      id,
      name: newExamName.trim(),
      shortName: newExamName.trim().slice(0, 10),
      date: newExamDate || '2026-12-31'
    };
    setExamPeriods(prev => [...prev, newEx]);
    setActiveExamId(id);
    setActiveDate(newEx.date);
    setNewExamName('');
    setNewExamDate('');
    setShowAddExam(false);
  };

  const handleSaveAll = () => {
    const finalGrade = selectedGrade === 'Custom' && customGradeInput.trim() ? customGradeInput.trim() : selectedGrade;
    onSave({
      grade: finalGrade,
      examPeriodId: activeExamId,
      examPeriods,
      subjects: subjectsList,
      targetDate: activeDate
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-b from-blue-50/50 dark:from-blue-950/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {isInitialSetup ? 'Welcome to Study Quest!' : 'Personalize Grade & Syllabus'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold uppercase tracking-wider">
                  Universal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure your grade, custom examination periods, and exact textbook study portions.
              </p>
            </div>
          </div>
          {!isInitialSetup && (
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* STEP 1: SELECT GRADE */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-500" />
                <span>1. Select Student Grade</span>
              </label>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Active: {selectedGrade}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GRADE_OPTIONS.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGradeChange(g)}
                  className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border ${
                    selectedGrade === g
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{g}</span>
                    {selectedGrade === g && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                </button>
              ))}
            </div>

            {selectedGrade === 'Custom' && (
              <div className="mt-2.5">
                <input
                  type="text"
                  placeholder="Enter custom grade name (e.g. College Freshman, IGCSE Year 11)..."
                  value={customGradeInput}
                  onChange={e => setCustomGradeInput(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* STEP 2: EXAMINATION PERIOD & TARGET DATE */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>2. Active Examination Period</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddExam(!showAddExam)}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> New Exam Period
              </button>
            </div>

            {/* Exam selector buttons */}
            <div className="flex flex-wrap gap-2">
              {examPeriods.map(ex => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    setActiveExamId(ex.id);
                    if (ex.date) setActiveDate(ex.date);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    activeExamId === ex.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {ex.name}
                </button>
              ))}
            </div>

            {/* Custom exam inline creator */}
            {showAddExam && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/50 space-y-2 animate-in fade-in duration-150">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Create Custom Exam</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Exam name (e.g. Midterm, FQT, Mock Exam)"
                    value={newExamName}
                    onChange={e => setNewExamName(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="date"
                    value={newExamDate}
                    onChange={e => setNewExamDate(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddExam(false)}
                    className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateExam}
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                  >
                    Add Exam
                  </button>
                </div>
              </div>
            )}

            {/* Target Exam Date input */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Exam Deadline Date:
              </span>
              <input
                type="date"
                value={activeDate}
                onChange={e => setActiveDate(e.target.value)}
                className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* STEP 3: SUBJECTS & STUDY PORTIONS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>3. Subjects &amp; Textbook Portions</span>
                </label>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Enter the starting and ending page numbers for each subject.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSubject(!showAddSubject)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition border border-emerald-200 dark:border-emerald-800/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject</span>
              </button>
            </div>

            {/* Add Subject Card Form */}
            {showAddSubject && (
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">New Subject Details</span>
                  <button onClick={() => setShowAddSubject(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Icon"
                      value={newSubEmoji}
                      onChange={e => setNewSubEmoji(e.target.value)}
                      className="w-full h-9 px-2 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-base"
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Subject Name (e.g. Physics, French)"
                      value={newSubName}
                      onChange={e => setNewSubName(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      placeholder="Start p."
                      value={newSubStart}
                      onChange={e => setNewSubStart(e.target.value)}
                      className="w-full h-9 px-2 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      placeholder="End p."
                      value={newSubEnd}
                      onChange={e => setNewSubEnd(e.target.value)}
                      className="w-full h-9 px-2 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleCreateSubject}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                  >
                    Save Subject
                  </button>
                </div>
              </div>
            )}

            {/* Subjects List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {subjectsList.map((s, idx) => {
                const range = s.ranges?.[0] || [1, 50];
                const totalPages = Math.max(1, range[1] - range[0] + 1);
                return (
                  <div
                    key={`${s.name}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 gap-3 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{s.emoji}</span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {s.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {totalPages} total pages
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-500">pp.</span>
                        <input
                          type="number"
                          value={range[0]}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 1;
                            handleUpdateSubjectRange(idx, val, range[1]);
                          }}
                          className="w-10 text-center bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                        <span className="text-slate-400">–</span>
                        <input
                          type="number"
                          value={range[1]}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || range[0];
                            handleUpdateSubjectRange(idx, range[0], val);
                          }}
                          className="w-12 text-center bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(idx)}
                        title="Delete subject"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Migration / Safe Progress Guarantee Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Safe Progress Protection:</strong> Your earned XP, focus records, knitted socks, Bean companions, and farm harvest will remain safe and sound across all grade updates.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          {!isInitialSetup ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
          ) : (
            <span className="text-xs text-slate-500">Step 1 of 1 · Setup</span>
          )}

          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 active:scale-95 transition"
          >
            <span>Save &amp; Enter Study Quest</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

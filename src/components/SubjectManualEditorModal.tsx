import React, { useState, useEffect } from 'react';
import { Subject } from '../types.ts';
import { X, BookOpen, Trash2, Check, AlertCircle, Sparkles } from 'lucide-react';

interface SubjectManualEditorModalProps {
  isOpen: boolean;
  examName: string;
  examShortName: string;
  subjectToEdit?: Subject | null;
  onSave: (subject: Subject, originalName?: string) => void;
  onDelete?: (subjectName: string) => void;
  onClose: () => void;
}

const COMMON_EMOJIS = ['📐', '⚡', '🧪', '🧬', '📖', '🌍', '💻', '📈', '🏺', '📝', '🔢', '🌿', '🎨', '📚'];

export const SubjectManualEditorModal: React.FC<SubjectManualEditorModalProps> = ({
  isOpen,
  examName,
  examShortName,
  subjectToEdit,
  onSave,
  onDelete,
  onClose
}) => {
  const isEditing = !!subjectToEdit && !!subjectToEdit.name;

  const [name, setName] = useState<string>('');
  const [emoji, setEmoji] = useState<string>('📖');
  const [pageRangeText, setPageRangeText] = useState<string>('1–35');
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(35);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when opening or when subjectToEdit changes
  useEffect(() => {
    if (subjectToEdit && subjectToEdit.name) {
      setName(subjectToEdit.name);
      setEmoji(subjectToEdit.emoji || '📖');
      const r = subjectToEdit.ranges?.[0] || [1, 35];
      setStartPage(r[0]);
      setEndPage(r[1]);
      setPageRangeText(`${r[0]}–${r[1]}`);
      setError(null);
    } else {
      setName('');
      setEmoji('📖');
      setStartPage(1);
      setEndPage(35);
      setPageRangeText('1–35');
      setError(null);
    }
  }, [subjectToEdit, isOpen]);

  if (!isOpen) return null;

  // Guess emoji based on subject name if user hasn't customized it
  const handleNameChange = (val: string) => {
    setName(val);
    setError(null);
    if (!isEditing) {
      const lower = val.toLowerCase();
      if (lower.includes('math') || lower.includes('algebra') || lower.includes('geom') || lower.includes('calc')) setEmoji('📐');
      else if (lower.includes('phys')) setEmoji('⚡');
      else if (lower.includes('chem')) setEmoji('🧪');
      else if (lower.includes('bio')) setEmoji('🧬');
      else if (lower.includes('eng') || lower.includes('liter') || lower.includes('gramm')) setEmoji('📖');
      else if (lower.includes('hist') || lower.includes('civic') || lower.includes('citiz')) setEmoji('🏺');
      else if (lower.includes('geog')) setEmoji('🌍');
      else if (lower.includes('comp') || lower.includes('tech') || lower.includes('cod')) setEmoji('💻');
      else if (lower.includes('econ') || lower.includes('busin')) setEmoji('📈');
      else if (lower.includes('art') || lower.includes('draw')) setEmoji('🎨');
    }
  };

  // Parse page range input (supports "1-35", "1–35", "1 to 35", "15 42")
  const handleRangeTextChange = (text: string) => {
    setPageRangeText(text);
    setError(null);

    // Normalize dashes and extract numbers
    const clean = text.replace(/–|—|to/gi, '-');
    const parts = clean.split('-').map(s => s.trim()).filter(Boolean);

    if (parts.length === 2) {
      const s = parseInt(parts[0], 10);
      const e = parseInt(parts[1], 10);
      if (!isNaN(s) && !isNaN(e)) {
        setStartPage(s);
        setEndPage(e);
      }
    } else if (parts.length === 1) {
      const s = parseInt(parts[0], 10);
      if (!isNaN(s)) {
        setStartPage(s);
      }
    }
  };

  const handleStartChange = (val: number) => {
    const s = Math.max(1, isNaN(val) ? 1 : val);
    setStartPage(s);
    const newEnd = Math.max(s, endPage);
    setEndPage(newEnd);
    setPageRangeText(`${s}–${newEnd}`);
    setError(null);
  };

  const handleEndChange = (val: number) => {
    const e = Math.max(1, isNaN(val) ? startPage : val);
    setEndPage(e);
    setPageRangeText(`${startPage}–${e}`);
    setError(null);
  };

  const totalPages = Math.max(0, endPage - startPage + 1);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a subject name (e.g. Mathematics, Physics).');
      return;
    }

    if (isNaN(startPage) || isNaN(endPage) || startPage < 1) {
      setError('Please enter a valid start page (minimum 1).');
      return;
    }

    if (endPage < startPage) {
      setError(`End page (${endPage}) cannot be less than start page (${startPage}).`);
      return;
    }

    const updatedSubject: Subject = {
      ...(subjectToEdit || {}),
      id: subjectToEdit?.id || `${examShortName.toLowerCase()}-${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: trimmedName,
      emoji: emoji || '📖',
      hue: subjectToEdit?.hue || (Math.abs(trimmedName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360),
      ranges: [[startPage, endPage]],
      targetPages: totalPages
    };

    onSave(updatedSubject, isEditing ? subjectToEdit?.name : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-[#FFFDF9] dark:bg-[#24201D] border border-[#EAE4D9] dark:border-[#38312B] shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE4D9] dark:border-[#38312B]">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E]">
              {emoji}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6]">
                  {isEditing ? 'Edit Subject' : 'Add Subject'}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8EFE8] dark:bg-[#233325] text-[#335336] dark:text-[#A3CCA6]">
                  {examShortName}
                </span>
              </div>
              <p className="text-xs text-[#6E6256] dark:text-[#ACA195]">
                Portion for {examName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#ACA195] hover:text-[#2B2118] dark:hover:text-[#F4EFE6] hover:bg-[#F4EFE6] dark:hover:bg-[#2A2521] transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* FIELD 1: Subject Name */}
          <div>
            <label className="block text-xs font-semibold text-[#6E6256] dark:text-[#ACA195] mb-1.5">
              Subject Name:
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Mathematics, Physics, Chemistry..."
              className="w-full h-11 px-3.5 rounded-xl bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E] text-sm font-bold text-[#2B2118] dark:text-[#F4EFE6] placeholder:text-[#ACA195] focus:outline-hidden focus:ring-1 focus:ring-[#C15C3D]"
            />
          </div>

          {/* Quick Emoji Bar */}
          <div>
            <label className="block text-[11px] font-semibold text-[#6E6256] dark:text-[#ACA195] mb-1">
              Subject Icon (optional):
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {COMMON_EMOJIS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`text-lg p-1.5 rounded-xl transition-all cursor-pointer ${
                    emoji === em
                      ? 'bg-[#F9EBE6] dark:bg-[#341F18] ring-2 ring-[#C15C3D] scale-110'
                      : 'hover:bg-[#F4EFE6] dark:hover:bg-[#2A2521] opacity-80 hover:opacity-100'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* FIELD 2: Pages to study */}
          <div className="p-4 rounded-2xl bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2B2118] dark:text-[#F4EFE6] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#C15C3D] dark:text-[#E07A5F]" />
                <span>Pages to study:</span>
              </label>
              <span className="text-[11px] font-semibold text-[#4F6F52] dark:text-[#A3CCA6]">
                {totalPages} {totalPages === 1 ? 'page' : 'pages'} total
              </span>
            </div>

            {/* Direct Page Range text input */}
            <div>
              <input
                type="text"
                value={pageRangeText}
                onChange={e => handleRangeTextChange(e.target.value)}
                placeholder="e.g. 1–35, 15–42, 20–50"
                className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#24201D] border border-[#EAE4D9] dark:border-[#38312B] text-sm font-bold text-[#2B2118] dark:text-[#F4EFE6] placeholder:text-[#ACA195] focus:outline-hidden focus:ring-1 focus:ring-[#C15C3D] font-mono"
              />
              <span className="text-[11px] text-[#6E6256] dark:text-[#ACA195] block mt-1">
                Enter page range like <strong>1–35</strong>, <strong>15–42</strong>, or <strong>20–50</strong>
              </span>
            </div>

            {/* Or Fine-Tune Start & End Pages */}
            <div className="pt-2 border-t border-[#EAE4D9] dark:border-[#38312B]">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-semibold text-[#6E6256] dark:text-[#ACA195] uppercase tracking-wider block mb-1">
                    Start Page
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={startPage}
                    onChange={e => handleStartChange(parseInt(e.target.value, 10))}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#24201D] border border-[#EAE4D9] dark:border-[#38312B] text-xs font-bold text-[#2B2118] dark:text-[#F4EFE6] text-center focus:ring-1 focus:ring-[#C15C3D]"
                  />
                </div>
                <span className="text-[#ACA195] pt-5 font-bold">–</span>
                <div className="flex-1">
                  <span className="text-[10px] font-semibold text-[#6E6256] dark:text-[#ACA195] uppercase tracking-wider block mb-1">
                    End Page
                  </span>
                  <input
                    type="number"
                    min={startPage}
                    value={endPage}
                    onChange={e => handleEndChange(parseInt(e.target.value, 10))}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#24201D] border border-[#EAE4D9] dark:border-[#38312B] text-xs font-bold text-[#2B2118] dark:text-[#F4EFE6] text-center focus:ring-1 focus:ring-[#C15C3D]"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Calculation Summary */}
            <div className="p-2.5 rounded-xl bg-[#E8EFE8] dark:bg-[#233325] border border-[#D5E2D4] dark:border-[#2F4732] text-xs flex items-center justify-between text-[#335336] dark:text-[#A3CCA6]">
              <span className="font-medium">Calculated Workload:</span>
              <span className="font-bold">
                Pages {startPage}–{endPage} · {totalPages} pages
              </span>
            </div>
          </div>

          {/* Validation Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-[#FDF2F2] dark:bg-[#341818] border border-[#F8D7D7] dark:border-[#4E2424] text-[#C15C3D] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#C15C3D]" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#EAE4D9] dark:border-[#38312B] flex items-center justify-between gap-2">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete ${name} from ${examShortName}?`)) {
                    onDelete(subjectToEdit!.name);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 text-xs font-semibold text-[#C15C3D] hover:underline px-2 py-1.5 rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E6256] dark:text-[#ACA195] hover:bg-[#F4EFE6] dark:hover:bg-[#2A2521] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#C15C3D] hover:bg-[#A94B2E] active:scale-95 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Subject</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

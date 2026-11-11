import React, { useState } from 'react';
import { QuizQuestion, QuestionType } from '../types.ts';
import { checkAnswerAgainstTextbook } from '../textbookQuizParser.ts';
import {
  BookOpen,
  X,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  RotateCcw,
  Sparkles,
  FileText,
  Bookmark
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TextbookQuizModalProps {
  subject: string;
  questions: QuizQuestion[];
  onComplete: (score: number, total: number, earnedXp: number) => void;
  onClose: () => void;
}

export const TextbookQuizModal: React.FC<TextbookQuizModalProps> = ({
  subject,
  questions,
  onComplete,
  onClose
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSelfMarkedCorrect, setIsSelfMarkedCorrect] = useState<boolean | null>(null);
  const [answersHistory, setAnswersHistory] = useState<
    Array<{
      question: QuizQuestion;
      userAnswer: string;
      isCorrect: boolean;
      selfEvaluated: boolean;
    }>
  >([]);
  const [isFinished, setIsFinished] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="w-full max-w-md glass-card rounded-3xl p-6 text-center flex flex-col items-center gap-4">
          <BookOpen className="w-10 h-10 text-blue-500" />
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            No Textbook Questions Found in this Range
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Make sure the uploaded PDF has extractable review exercises, or adjust the start and end page numbers.
          </p>
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];

  const handleCheckAnswer = () => {
    if (!userAnswer.trim()) return;

    setHasSubmitted(true);

    if (q.hasVerifiedAnswer && q.verifiedAnswer) {
      const correct = checkAnswerAgainstTextbook(userAnswer, q.verifiedAnswer, q.type);
      setIsSelfMarkedCorrect(correct);
    }
  };

  const handleSelfMark = (correct: boolean) => {
    setIsSelfMarkedCorrect(correct);
  };

  const handleNextQuestion = () => {
    const isCorrect = isSelfMarkedCorrect === true;

    const record = {
      question: q,
      userAnswer,
      isCorrect,
      selfEvaluated: !q.hasVerifiedAnswer
    };

    const newHistory = [...answersHistory, record];
    setAnswersHistory(newHistory);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setUserAnswer('');
      setHasSubmitted(false);
      setIsSelfMarkedCorrect(null);
    } else {
      // Completed all questions
      setIsFinished(true);
      const score = newHistory.filter(h => h.isCorrect).length;
      const earnedXp = score * 15 + 10;
      if (score > 0) {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      }
      onComplete(score, questions.length, earnedXp);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl glass-card rounded-3xl p-5 sm:p-7 flex flex-col gap-4 shadow-2xl border border-white/20 max-h-[92vh] overflow-y-auto">
        {!isFinished ? (
          <div className="flex flex-col gap-4">
            {/* Top Examination Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                  {currentIdx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    {subject} Practice
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {q.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                </div>
              </div>

              {/* Exact Textbook Page Reference Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Textbook Page {q.page}</span>
              </div>
            </div>

            {/* Section / Chapter Heading if identified */}
            {q.sectionTitle && (
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {q.sectionTitle}
              </div>
            )}

            {/* Verbatim Textbook Question Text */}
            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5">
              <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                {q.questionNumber ? `${q.questionNumber}. ` : ''}
                {q.prompt}
              </p>
            </div>

            {/* Interactive Inputs based on Authentic Question Type */}
            {q.type === 'multiple_choice' && q.options && q.options.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                {q.options.map((opt, i) => {
                  const letterMatch = opt.match(/^[A-D]|[a-d]|[ሀ-መ]/)?.[0]?.toUpperCase() || String(i);
                  const isSelected = userAnswer.toUpperCase().startsWith(letterMatch) || userAnswer === opt;

                  return (
                    <button
                      key={i}
                      disabled={hasSubmitted}
                      onClick={() => setUserAnswer(opt)}
                      className={`w-full p-3.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all border flex items-start gap-3 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        {letterMatch}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {['True', 'False'].map(choice => (
                  <button
                    key={choice}
                    disabled={hasSubmitted}
                    onClick={() => setUserAnswer(choice)}
                    className={`h-12 rounded-xl text-sm font-bold border transition-all ${
                      userAnswer === choice
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {(q.type === 'fill_in_blank' || q.type === 'short_answer' || q.type === 'calculation') && (
              <div className="flex flex-col gap-2 pt-1">
                <input
                  type="text"
                  placeholder={
                    q.type === 'fill_in_blank'
                      ? 'Type the word that fills the blank...'
                      : 'Type your answer or numerical result...'
                  }
                  value={userAnswer}
                  disabled={hasSubmitted}
                  onChange={e => setUserAnswer(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !hasSubmitted) handleCheckAnswer();
                  }}
                  className="h-12 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-sm focus:border-blue-500"
                />
              </div>
            )}

            {/* Answer Feedback / Verification Area */}
            {hasSubmitted && (
              <div className="p-4 rounded-2xl border flex flex-col gap-2.5 animate-in fade-in duration-200 bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
                {q.hasVerifiedAnswer ? (
                  <div>
                    <div className="flex items-center gap-2">
                      {isSelfMarkedCorrect ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      )}
                      <span
                        className={`text-sm font-extrabold ${
                          isSelfMarkedCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                        }`}
                      >
                        {isSelfMarkedCorrect
                          ? 'Correct according to Textbook Answer Key! 🎉'
                          : `Verified Textbook Answer: ${q.verifiedAnswer}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Source: Publisher Answer Key matching page {q.page}.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-amber-500" />
                      <span className="text-sm font-extrabold text-amber-800 dark:text-amber-300">
                        Self-Evaluation (Textbook Page {q.page})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      The textbook does not include a publisher answer key for this question. Compare your solution with page {q.page} of your textbook.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleSelfMark(true)}
                        className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all ${
                          isSelfMarkedCorrect === true
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                        }`}
                      >
                        ✓ My Answer Matches Page {q.page}
                      </button>

                      <button
                        onClick={() => handleSelfMark(false)}
                        className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all ${
                          isSelfMarkedCorrect === false
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                        }`}
                      >
                        ✕ Needs Review
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Exit Practice
              </button>

              {!hasSubmitted ? (
                <button
                  disabled={!userAnswer.trim()}
                  onClick={handleCheckAnswer}
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  Verify Answer
                </button>
              ) : (
                <button
                  disabled={isSelfMarkedCorrect === null}
                  onClick={handleNextQuestion}
                  className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1 shadow-md"
                >
                  <span>{currentIdx + 1 === questions.length ? 'See Results' : 'Next Question'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Post-Practice Summary Screen */
          <div className="flex flex-col items-center text-center gap-4 py-3 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-3xl shadow-inner">
              🎓
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Textbook Practice Complete!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Subject: {subject}
              </p>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 w-full justify-around">
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {answersHistory.filter(h => h.isCorrect).length} / {questions.length}
                </span>
                <span className="block text-[11px] text-slate-400 font-bold">Questions Solved</span>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-white/10" />
              <div>
                <span className="text-2xl font-black text-yellow-500">
                  +{answersHistory.filter(h => h.isCorrect).length * 15 + 10} XP
                </span>
                <span className="block text-[11px] text-slate-400 font-bold">Earned</span>
              </div>
            </div>

            {/* Questions Review List with exact textbook pages */}
            <div className="w-full text-left flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Question Reference Breakdown
              </span>
              {answersHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 max-w-[80%]">
                    {item.isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                      Q{item.question.questionNumber || idx + 1}: {item.question.prompt}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[11px] shrink-0">
                    p. {item.question.page}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
            >
              Done & Save Progress
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

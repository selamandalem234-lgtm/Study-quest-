export interface StudyPortion {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
}

export interface Subject {
  id?: string;
  name: string;
  emoji: string;
  hue: number;
  ranges: [number, number][];
  portions?: StudyPortion[];
  targetPages?: number;
}

export interface ExamPeriod {
  id: string;
  name: string;
  shortName: string;
  date: string; // YYYY-MM-DD
}

export interface ExamRecord {
  id: string; // Strictly 'test2' | 'fqt' | 'fe'
  name: string; // Strictly 'Test 2', 'FQT', or 'FE (Final Examination)'
  shortName: string; // Strictly 'Test 2', 'FQT', or 'FE'
  examType?: 'test2' | 'fqt' | 'fe';
  quarter: number; // 2, 1, or 4
  date: string; // Target exam date 'YYYY-MM-DD'
  subjects: Subject[]; // Dedicated subjects and page ranges for THIS exam only
  progress: Record<string, number>; // subjectName -> current page for THIS exam only
  credited: Record<string, number>; // subjectName -> pages studied for THIS exam only
  targetDailyPages?: number;
  pdfFileName?: string;
  pdfUploadedAt?: number;
}

export interface DayRecord {
  p: number; // pages
  q: Record<number, number>; // quarter -> pages
  s: number; // sessions completed
  m: number; // minutes studied
}

export interface QuizLogItem {
  s: string; // subject
  q: number; // quarter
  p: number; // page
  ok: boolean;
  d: string; // date YYYY-MM-DD
}

export interface TimerState {
  mode: 'sprint' | 'pomodoro' | 'hardest';
  phase: 'work' | 'break';
  stage: 'running' | 'paused' | 'done';
  subject: string;
  total: number;
  startedAt: number;
  endsAt: number | null;
  left: number | null;
  round: number;
  goalA: number;
  goalB: number;
  startStudied: number;
  full: boolean;
  mins: number;
  reward: string;
  slips: number;
  hiddenAt: number | null;
  sadUntil: number;
  socks: number;
}

export interface AppState {
  grade: string; // e.g. 'Grade 10', 'Grade 6', 'Grade 11 (Natural Science)'
  activeExamId: string; // e.g. 'test2' or 'fqt'
  exams: Record<string, ExamRecord>; // Isolated exam records: Test 2 and FQT have separate subjects & progress
  examPeriodId: string; // active exam period id (alias for activeExamId)
  examPeriods: ExamPeriod[]; // customizable exam periods
  userSubjects: Subject[]; // customizable subjects and study portions
  quarter: number; // 1-4 for backward compatibility
  date: string;
  progress: Record<string, number>;
  credited: Record<string, number>;
  xp: number;
  totalPages: number;
  days: Record<string, DayRecord>;
  badges: Record<string, string>;
  bestStreak: number;
  sessions: number;
  pomodoros: number;
  early: boolean;
  hideDone: boolean;
  hardest: string;
  rewards: string;
  sound: boolean;
  timer: TimerState | null;
  offsets: Record<string, number>;
  quiz: QuizLogItem[];
  quizBlocklist: string[];
  socks: number;
  decor: Record<string, boolean>;
}

export interface BadgeDef {
  id: string;
  e: string;
  n: string;
  d: string;
  t: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  pages: number;
  fin: number;
  streak: number;
  early: boolean;
  sessions: number;
  pomos: number;
  pct: number;
}

export interface DecorItem {
  id: string;
  n: string;
  c: number;
  x: number;
  h: number;
}

export interface BookMeta {
  subject: string;
  name: string;
  pageCount: number;
  textPages: number;
  savedAt: number;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_in_blank' | 'short_answer' | 'calculation';

export interface QuizQuestion {
  id: string;
  page: number;
  subject: string;
  sectionTitle?: string;
  questionNumber: string;
  type: QuestionType;
  prompt: string;
  text: string;
  options?: string[];
  answer: string;
  verifiedAnswer?: string;
  hasVerifiedAnswer: boolean;
  contextSnippet?: string;
  kind?: string;
  concept?: string;
  sent?: string;
  sk?: string;
  hint?: string;
  hintFull?: string;
  score?: number;
  src?: string;
  done?: boolean;
  ok?: boolean;
}


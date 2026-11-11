import { Subject, BadgeDef, DecorItem, ExamPeriod, ExamRecord, AppState } from './types.ts';

export const STORAGE_KEY = 'grade10-test2-page-tracker-v1';

export const XP_PAGE = 10;
export const XP_SESSION = 25;
export const XP_SUBJECT = 100;
export const XP_BADGE = 50;
export const XP_QUIZ = 5;
export const XP_QUIZ_RIGHT = 2;

export const DEFAULT_REWARDS = '🍪 A snack, 📺 One short video, 🎮 One game round, 🚶 A quick walk';

export interface ExamPresetOption {
  id: string;
  name: string;
  shortName: string;
  quarter: number;
  defaultDate: string;
  quarterIndex: number;
}

// Strictly separate examination presets: ONLY FQT, Test 2, and FE
export const STANDARD_EXAM_PRESETS: ExamPresetOption[] = [
  { id: 'fqt', name: 'FQT (First Quarter Test)', shortName: 'FQT', quarter: 1, defaultDate: '2026-11-20', quarterIndex: 0 },
  { id: 'test2', name: 'Test 2', shortName: 'Test 2', quarter: 2, defaultDate: '2026-12-15', quarterIndex: 1 },
  { id: 'fe', name: 'FE (Final Examination)', shortName: 'FE', quarter: 4, defaultDate: '2027-06-25', quarterIndex: 3 }
];

// Default Examination Periods (Strictly FQT, Test 2, and FE)
export const DEFAULT_EXAM_PERIODS: ExamPeriod[] = [
  { id: 'fqt', name: 'FQT (First Quarter Test)', shortName: 'FQT', date: '2026-11-20' },
  { id: 'test2', name: 'Test 2', shortName: 'Test 2', date: '2026-12-15' },
  { id: 'fe', name: 'FE (Final Examination)', shortName: 'FE', date: '2027-06-25' }
];

export const GRADE_OPTIONS = [
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11 (Natural Science)',
  'Grade 11 (Social Science)',
  'Grade 12 (Natural Science)',
  'Grade 12 (Social Science)',
  'Custom'
] as const;

// Authentic Grade 10 portions for Gibson School Systems 2026/2027 (preserves existing accounts)
export const GRADE_10_SUBJECTS: Subject[] = [
  { name: 'Amharic', emoji: '📝', hue: 335, ranges: [[1, 30], [48, 84], [85, 111], [126, 151]] },
  { name: 'Math', emoji: '📐', hue: 225, ranges: [[1, 67], [81, 170], [171, 239], [255, 364]] },
  { name: 'Physics', emoji: '⚡', hue: 265, ranges: [[1, 45], [59, 116], [117, 175], [190, 244]] },
  { name: 'Chemistry', emoji: '🧪', hue: 165, ranges: [[1, 46], [60, 105], [106, 164], [197, 296]] },
  { name: 'Biology', emoji: '🧬', hue: 130, ranges: [[1, 40], [51, 95], [96, 136], [143, 174]] },
  { name: 'Citizenship', emoji: '🤝', hue: 22, ranges: [[1, 53], [64, 113], [114, 144], [154, 211]] },
  { name: 'Geography', emoji: '🌍', hue: 190, ranges: [[1, 37], [55, 100], [101, 136], [151, 195]] },
  { name: 'Integrated English', emoji: '📖', hue: 300, ranges: [[1, 33], [34, 65], [48, 86], [99, 229]] },
  { name: 'Computer Education', emoji: '💻', hue: 205, ranges: [[1, 45], [62, 101], [102, 160], [178, 224]] },
  { name: 'Economics', emoji: '📈', hue: 42, ranges: [[1, 28], [49, 87], [88, 113], [134, 184]] },
  { name: 'History', emoji: '🏺', hue: 6, ranges: [[1, 37], [44, 110], [111, 163], [170, 228]] },
  { name: 'Afaan Oromoo', emoji: '💬', hue: 80, ranges: [[1, 15], [25, 47], [48, 70], [82, 102]] }
];

export const subjects: Subject[] = GRADE_10_SUBJECTS;

// Intelligent Curriculum Presets for Each Grade (Students can freely customize)
export function getDefaultSubjectsForGrade(grade: string): Subject[] {
  if (grade === 'Grade 10') {
    return GRADE_10_SUBJECTS;
  }

  if (grade === 'Grade 1' || grade === 'Grade 2') {
    return [
      { name: 'Mathematics', emoji: '🔢', hue: 210, ranges: [[1, 30], [31, 60], [61, 90], [91, 120]] },
      { name: 'English & Phonics', emoji: '🔤', hue: 330, ranges: [[1, 25], [26, 50], [51, 75], [76, 100]] },
      { name: 'Environmental Science', emoji: '🌿', hue: 140, ranges: [[1, 20], [21, 40], [41, 60], [61, 80]] },
      { name: 'Reading & Stories', emoji: '📚', hue: 45, ranges: [[1, 25], [26, 50], [51, 75], [76, 100]] },
      { name: 'Art & Craft', emoji: '🎨', hue: 280, ranges: [[1, 15], [16, 30], [31, 45], [46, 60]] }
    ];
  }

  if (grade === 'Grade 3' || grade === 'Grade 4' || grade === 'Grade 5') {
    return [
      { name: 'Mathematics', emoji: '📐', hue: 215, ranges: [[1, 45], [46, 90], [91, 135], [136, 180]] },
      { name: 'General Science', emoji: '🔬', hue: 150, ranges: [[1, 35], [36, 75], [76, 115], [116, 150]] },
      { name: 'English', emoji: '📖', hue: 310, ranges: [[1, 40], [41, 80], [81, 120], [121, 160]] },
      { name: 'Social Studies', emoji: '🌍', hue: 190, ranges: [[1, 30], [31, 65], [66, 95], [96, 130]] },
      { name: 'Citizenship', emoji: '🤝', hue: 25, ranges: [[1, 25], [26, 50], [51, 75], [76, 100]] },
      { name: 'Amharic', emoji: '📝', hue: 340, ranges: [[1, 30], [31, 60], [61, 90], [91, 120]] }
    ];
  }

  if (grade === 'Grade 6') {
    return [
      { name: 'Mathematics', emoji: '📐', hue: 220, ranges: [[1, 50], [51, 100], [101, 150], [151, 200]] },
      { name: 'General Science', emoji: '🧪', hue: 160, ranges: [[1, 45], [46, 90], [91, 135], [136, 180]] },
      { name: 'English', emoji: '📖', hue: 305, ranges: [[1, 40], [41, 80], [81, 120], [121, 165]] },
      { name: 'Social Studies', emoji: '🌍', hue: 195, ranges: [[1, 35], [36, 70], [71, 105], [106, 140]] },
      { name: 'Citizenship', emoji: '🤝', hue: 20, ranges: [[1, 30], [31, 60], [61, 90], [91, 120]] },
      { name: 'Information Technology (ICT)', emoji: '💻', hue: 260, ranges: [[1, 35], [36, 70], [71, 105], [106, 140]] },
      { name: 'Career & Tech', emoji: '🛠️', hue: 45, ranges: [[1, 25], [26, 50], [51, 75], [76, 100]] }
    ];
  }

  if (grade === 'Grade 7' || grade === 'Grade 8') {
    return [
      { name: 'Mathematics', emoji: '📐', hue: 220, ranges: [[1, 55], [56, 115], [116, 170], [171, 230]] },
      { name: 'General Science', emoji: '🔬', hue: 155, ranges: [[1, 50], [51, 100], [101, 150], [151, 200]] },
      { name: 'English', emoji: '📖', hue: 300, ranges: [[1, 45], [46, 90], [91, 135], [136, 180]] },
      { name: 'Social Studies', emoji: '🌍', hue: 190, ranges: [[1, 40], [41, 80], [81, 120], [121, 160]] },
      { name: 'Citizenship', emoji: '🤝', hue: 25, ranges: [[1, 35], [36, 70], [71, 105], [106, 140]] },
      { name: 'Information Technology', emoji: '💻', hue: 260, ranges: [[1, 40], [41, 80], [81, 120], [121, 160]] },
      { name: 'Amharic', emoji: '📝', hue: 335, ranges: [[1, 35], [36, 70], [71, 105], [106, 140]] }
    ];
  }

  if (grade === 'Grade 9') {
    return [
      { name: 'Mathematics', emoji: '📐', hue: 225, ranges: [[1, 60], [61, 120], [121, 180], [181, 240]] },
      { name: 'Physics', emoji: '⚡', hue: 265, ranges: [[1, 40], [41, 85], [86, 130], [131, 175]] },
      { name: 'Chemistry', emoji: '🧪', hue: 165, ranges: [[1, 45], [46, 90], [91, 135], [136, 180]] },
      { name: 'Biology', emoji: '🧬', hue: 130, ranges: [[1, 40], [41, 80], [81, 120], [121, 160]] },
      { name: 'English', emoji: '📖', hue: 300, ranges: [[1, 45], [46, 90], [91, 135], [136, 180]] },
      { name: 'Geography', emoji: '🌍', hue: 190, ranges: [[1, 35], [36, 70], [71, 105], [106, 140]] },
      { name: 'History', emoji: '🏺', hue: 10, ranges: [[1, 35], [36, 70], [71, 105], [106, 140]] },
      { name: 'Citizenship', emoji: '🤝', hue: 25, ranges: [[1, 30], [31, 60], [61, 90], [91, 120]] },
      { name: 'Economics', emoji: '📈', hue: 45, ranges: [[1, 30], [31, 60], [61, 90], [91, 120]] },
      { name: 'Computer Science', emoji: '💻', hue: 210, ranges: [[1, 35], [36, 70], [71, 105], [106, 140]] }
    ];
  }

  if (grade.includes('Grade 11') && grade.includes('Natural')) {
    return [
      { name: 'Advanced Mathematics', emoji: '📐', hue: 225, ranges: [[1, 75], [76, 150], [151, 225], [226, 300]] },
      { name: 'Physics', emoji: '⚡', hue: 265, ranges: [[1, 60], [61, 120], [121, 180], [181, 240]] },
      { name: 'Chemistry', emoji: '🧪', hue: 165, ranges: [[1, 55], [56, 110], [111, 165], [166, 220]] },
      { name: 'Biology', emoji: '🧬', hue: 130, ranges: [[1, 50], [51, 100], [101, 150], [151, 200]] },
      { name: 'English', emoji: '📖', hue: 300, ranges: [[1, 45], [46, 90], [91, 135], [136, 180]] },
      { name: 'Information Technology', emoji: '💻', hue: 210, ranges: [[1, 40], [41, 80], [81, 120], [121, 160]] },
      { name: 'Technical Drawing', emoji: '📏', hue: 40, ranges: [[1, 35], [36, 70], [71, 105], [106, 140]] }
    ];
  }

  if (grade.includes('Grade 11') && grade.includes('Social')) {
    return [
      { name: 'Mathematics (Social)', emoji: '📐', hue: 220, ranges: [[1, 50], [51, 100], [101, 150], [151, 200]] },
      { name: 'Economics', emoji: '📈', hue: 45, ranges: [[1, 55], [56, 110], [111, 165], [166, 220]] },
      { name: 'Geography', emoji: '🌍', hue: 190, ranges: [[1, 50], [51, 100], [101, 150], [151, 200]] },
      { name: 'History', emoji: '🏺', hue: 10, ranges: [[1, 50], [51, 100], [101, 150], [151, 200]] },
      { name: 'English', emoji: '📖', hue: 300, ranges: [[1, 45], [46, 90], [91, 135], [136, 180]] },
      { name: 'Business Education', emoji: '💼', hue: 160, ranges: [[1, 40], [41, 80], [81, 120], [121, 160]] },
      { name: 'Information Technology', emoji: '💻', hue: 210, ranges: [[1, 35], [36, 70], [71, 105], [106, 140]] }
    ];
  }

  if (grade.includes('Grade 12') && grade.includes('Natural')) {
    return [
      { name: 'Advanced Mathematics', emoji: '📐', hue: 225, ranges: [[1, 80], [81, 160], [161, 240], [241, 320]] },
      { name: 'Physics', emoji: '⚡', hue: 265, ranges: [[1, 65], [66, 130], [131, 195], [196, 260]] },
      { name: 'Chemistry', emoji: '🧪', hue: 165, ranges: [[1, 60], [61, 120], [121, 180], [181, 240]] },
      { name: 'Biology', emoji: '🧬', hue: 130, ranges: [[1, 55], [56, 110], [111, 165], [166, 220]] },
      { name: 'English', emoji: '📖', hue: 300, ranges: [[1, 50], [51, 100], [101, 150], [151, 200]] },
      { name: 'Information Technology', emoji: '💻', hue: 210, ranges: [[1, 45], [46, 90], [91, 135], [136, 180]] }
    ];
  }

  if (grade.includes('Grade 12') && grade.includes('Social')) {
    return [
      { name: 'Mathematics (Social)', emoji: '📐', hue: 220, ranges: [[1, 55], [56, 110], [111, 165], [166, 220]] },
      { name: 'Economics', emoji: '📈', hue: 45, ranges: [[1, 60], [61, 120], [121, 180], [181, 240]] },
      { name: 'Geography', emoji: '🌍', hue: 190, ranges: [[1, 55], [56, 110], [111, 165], [166, 220]] },
      { name: 'History', emoji: '🏺', hue: 10, ranges: [[1, 55], [56, 110], [111, 165], [166, 220]] },
      { name: 'English', emoji: '📖', hue: 300, ranges: [[1, 50], [51, 100], [101, 150], [151, 200]] },
      { name: 'Business & Management', emoji: '💼', hue: 160, ranges: [[1, 45], [46, 90], [91, 135], [136, 180]] }
    ];
  }

  // Custom or generic fallback
  return [
    { name: 'Mathematics', emoji: '📐', hue: 220, ranges: [[1, 50], [51, 100], [101, 150], [151, 200]] },
    { name: 'Science', emoji: '🔬', hue: 155, ranges: [[1, 45], [46, 90], [91, 135], [136, 180]] },
    { name: 'English / Language Arts', emoji: '📖', hue: 305, ranges: [[1, 40], [41, 80], [81, 120], [121, 160]] },
    { name: 'Social Studies / History', emoji: '🌍', hue: 190, ranges: [[1, 35], [36, 70], [71, 105], [106, 140]] }
  ];
}

export const MODES = {
  sprint: { label: 'Just 10 minutes', work: 10, brk: 0 },
  pomodoro: { label: 'Pomodoro', work: 25, brk: 5 },
  hardest: { label: 'Hardest subject first', work: 10, brk: 0 }
};

export const BADGES: BadgeDef[] = [
  { id: 'first', e: '🌱', n: 'First step', d: 'Log your first page', t: s => s.pages >= 1 },
  { id: 'p50', e: '📘', n: 'First 50 pages', d: 'Study 50 pages in total', t: s => s.pages >= 50 },
  { id: 'p200', e: '📚', n: '200 pages', d: 'Study 200 pages in total', t: s => s.pages >= 200 },
  { id: 'p500', e: '🏔️', n: '500 pages', d: 'Study 500 pages in total', t: s => s.pages >= 500 },
  { id: 'fin1', e: '🏁', n: 'Subject finished', d: 'Finish every page of one subject', t: s => s.fin >= 1 },
  { id: 'fin3', e: '🏆', n: 'Triple finish', d: 'Finish three subjects', t: s => s.fin >= 3 },
  { id: 'str3', e: '🔥', n: '3 days in a row', d: 'Study three days running', t: s => s.streak >= 3 },
  { id: 'str7', e: '🚀', n: 'One-week streak', d: 'Study seven days running', t: s => s.streak >= 7 },
  { id: 'early', e: '🌅', n: 'Early bird', d: 'Study before 8 AM', t: s => s.early },
  { id: 'focus1', e: '⏱️', n: 'First focus round', d: 'Finish a full timer', t: s => s.sessions >= 1 },
  { id: 'pomo3', e: '🍅', n: 'Pomodoro pro', d: 'Finish three 25-minute rounds', t: s => s.pomos >= 3 },
  { id: 'half', e: '🌗', n: 'Halfway there', d: 'Cover 50% of the active exam portion', t: s => s.pct >= 50 },
  { id: 'ready', e: '🎓', n: 'Test ready', d: 'Cover 100% of the active exam portion', t: s => s.pct >= 100 }
];

export const RANKS: [number, string][] = [
  [1, 'Rookie'],
  [3, 'Learner'],
  [5, 'Scholar'],
  [8, 'Master'],
  [10, 'Top of the Class']
];

export const DECOR: DecorItem[] = [
  { id: 'plant', n: 'Potted Fern', c: 3, x: 640, h: 76 },
  { id: 'candle', n: 'Amber Candle', c: 4, x: 780, h: 72 },
  { id: 'chair', n: 'Cozy Armchair', c: 6, x: 920, h: 62 },
  { id: 'frame', n: 'Nature Canvas', c: 8, x: 1070, h: 90 },
  { id: 'rug', n: 'Yarn Basket', c: 10, x: 1215, h: 56 },
  { id: 'books', n: 'Oak Bookshelf', c: 12, x: 1375, h: 98 }
];

export const xpFor = (n: number) => 50 * n * (n - 1);

export function levelOf(xp: number): number {
  let n = 1;
  while (xp >= xpFor(n + 1)) n++;
  return n;
}

export function rankOf(l: number): string {
  let r = RANKS[0][1];
  RANKS.forEach(([min, name]) => {
    if (l >= min) r = name;
  });
  return r;
}

export const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const todayKey = () => dayKey(new Date());
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const ord = (q: number) => ['1st', '2nd', '3rd', '4th'][q - 1] || q + 'th';
export const fmtTime = (ms: number) => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return pad(Math.floor(t / 60)) + ':' + pad(t % 60);
};

export const byName = (n: string, customList?: Subject[]) => {
  const list = customList && customList.length > 0 ? customList : subjects;
  return list.find(s => s.name === n);
};

export const countFor = (r: [number, number]) => {
  if (!r || r.length < 2) return 1;
  return Math.max(1, r[1] - r[0] + 1);
};

/**
 * Creates completely isolated default exams for a grade.
 * FQT and Test 2 have completely different page ranges, subjects, and progress records.
 */
export function createDefaultExamsForGrade(grade = 'Grade 10'): Record<string, ExamRecord> {
  const isG10 = grade === 'Grade 10';
  const baseSubjects = isG10 ? GRADE_10_SUBJECTS : getDefaultSubjectsForGrade(grade);
  const result: Record<string, ExamRecord> = {};

  STANDARD_EXAM_PRESETS.forEach(preset => {
    const qIdx = preset.quarterIndex;
    const examSubjects: Subject[] = baseSubjects.map(s => {
      const range = (s.ranges && s.ranges[qIdx]) || s.ranges?.[0] || [1, 50];
      return {
        id: `${preset.id}-${s.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: s.name,
        emoji: s.emoji,
        hue: s.hue,
        ranges: [range],
        portions: s.portions ? [...s.portions] : undefined,
        targetPages: countFor(range)
      };
    });

    result[preset.id] = {
      id: preset.id,
      name: preset.name,
      shortName: preset.shortName,
      examType: preset.id as any,
      quarter: preset.quarter,
      date: preset.defaultDate,
      subjects: examSubjects,
      progress: {},
      credited: {}
    };
  });

  return result;
}

/**
 * Safely migrates existing user data into the isolated exams structure.
 * Strictly guarantees ONLY the three allowed examination types: 'test2', 'fqt', and 'fe'.
 * Never resets user progress, XP, streaks, or crops.
 */
export function migrateOrEnsureExams(rawState: any): { exams: Record<string, ExamRecord>; activeExamId: string } {
  const grade = rawState?.grade || 'Grade 10';
  const defaults = createDefaultExamsForGrade(grade);

  // If already migrated and contains valid exams
  if (rawState?.exams && typeof rawState.exams === 'object' && Object.keys(rawState.exams).length > 0) {
    const rawExams = rawState.exams;
    const exams: Record<string, ExamRecord> = {
      test2: defaults.test2,
      fqt: defaults.fqt,
      fe: defaults.fe
    };

    // Safely copy over test2, fqt, and fe
    ['test2', 'fqt', 'fe'].forEach(id => {
      const v = rawExams[id];
      if (v && v.id && v.name && Array.isArray(v.subjects)) {
        exams[id] = {
          id: id as any,
          name: id === 'test2' ? 'Test 2' : id === 'fqt' ? 'FQT' : 'FE (Final Examination)',
          shortName: id === 'test2' ? 'Test 2' : id === 'fqt' ? 'FQT' : 'FE',
          examType: id as any,
          quarter: Number(v.quarter) || (id === 'fqt' ? 1 : id === 'test2' ? 2 : 4),
          date: v.date || defaults[id].date,
          subjects: v.subjects.map((s: Subject) => ({
            ...s,
            ranges: s.ranges && s.ranges.length > 0 ? s.ranges : [[1, 50]]
          })),
          progress: v.progress || {},
          credited: v.credited || {}
        };
      }
    });

    // Check if legacy 'final' or 'test4' has custom subjects or progress, map into 'fe'
    const legacyFinal = rawExams.final || rawExams.test4;
    if (legacyFinal) {
      if (Array.isArray(legacyFinal.subjects) && legacyFinal.subjects.length > 0 && !rawExams.fe) {
        exams.fe.subjects = legacyFinal.subjects;
      }
      if (legacyFinal.progress) {
        exams.fe.progress = { ...exams.fe.progress, ...legacyFinal.progress };
      }
      if (legacyFinal.credited) {
        exams.fe.credited = { ...exams.fe.credited, ...legacyFinal.credited };
      }
    }

    let activeId = rawState.activeExamId;
    if (activeId === 'final' || activeId === 'test4' || activeId === 'q4') activeId = 'fe';
    if (activeId === 'q1') activeId = 'fqt';
    if (activeId === 'q2' || activeId === 'test3') activeId = 'test2';
    if (!['test2', 'fqt', 'fe'].includes(activeId)) {
      activeId = 'test2';
    }

    return { exams, activeExamId: activeId };
  }

  // First-time non-destructive migration:
  const exams: Record<string, ExamRecord> = {
    test2: defaults.test2,
    fqt: defaults.fqt,
    fe: defaults.fe
  };
  const rawProgress = rawState?.progress || {};
  const rawCredited = rawState?.credited || {};

  // Safely migrate existing progress entries into the corresponding exam records
  for (const [key, val] of Object.entries(rawProgress)) {
    const numVal = Number(val);
    if (isNaN(numVal)) continue;

    if (key.startsWith('1|')) {
      const subj = key.slice(2);
      exams.fqt.progress[subj] = numVal;
      if (rawCredited[key]) exams.fqt.credited[subj] = Number(rawCredited[key]);
    } else if (key.startsWith('2|')) {
      const subj = key.slice(2);
      exams.test2.progress[subj] = numVal;
      if (rawCredited[key]) exams.test2.credited[subj] = Number(rawCredited[key]);
    } else if (key.startsWith('4|')) {
      const subj = key.slice(2);
      exams.fe.progress[subj] = numVal;
      if (rawCredited[key]) exams.fe.credited[subj] = Number(rawCredited[key]);
    } else {
      // Direct subject name: attach to quarter active when progress was made
      const q = rawState?.quarter || 2;
      const targetExam = q === 1 ? exams.fqt : q === 4 ? exams.fe : exams.test2;
      targetExam.progress[key] = numVal;
      if (rawCredited[key]) targetExam.credited[key] = Number(rawCredited[key]);
    }
  }

  let activeId = 'test2';
  if (['test2', 'fqt', 'fe'].includes(rawState?.activeExamId)) {
    activeId = rawState.activeExamId;
  } else if (rawState?.examPeriodId === 'q1' || rawState?.quarter === 1) {
    activeId = 'fqt';
  } else if (rawState?.examPeriodId === 'q4' || rawState?.quarter === 4 || rawState?.activeExamId === 'final') {
    activeId = 'fe';
  }

  return { exams, activeExamId: activeId };
}



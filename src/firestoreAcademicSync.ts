import { AppState, ExamRecord, Subject, StudyPortion } from './types.ts';
import { createDefaultExamsForGrade } from './constants.ts';

/**
 * Converts a Subject into a Firestore-safe flat object.
 * Firestore strictly forbids nested arrays (e.g. ranges: [[1, 50]] or arrays inside array objects).
 */
export function subjectToFirestore(s: Subject): Record<string, any> {
  const r = s.ranges && s.ranges.length > 0 && Array.isArray(s.ranges[0]) ? s.ranges[0] : [1, 50];
  const rangeStr = (s.ranges || []).map(pair => `${pair[0]}-${pair[1]}`).join(';');
  const portionsStr = s.portions && s.portions.length > 0 ? JSON.stringify(s.portions) : '';

  return {
    id: s.id || `${(s.name || 'sub').toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: s.name || 'Subject',
    emoji: s.emoji || '📖',
    hue: typeof s.hue === 'number' ? s.hue : 220,
    startPage: Number(r[0]) || 1,
    endPage: Number(r[1]) || 50,
    rangeStr: rangeStr || `${r[0]}-${r[1]}`,
    portionsStr,
    targetPages: typeof s.targetPages === 'number' ? s.targetPages : Math.max(1, (r[1] - r[0] + 1))
  };
}

/**
 * Restores a Subject from Firestore data into the application's Subject model.
 */
export function subjectFromFirestore(raw: any): Subject {
  let ranges: [number, number][] = [];

  if (raw.rangeStr && typeof raw.rangeStr === 'string' && raw.rangeStr.trim()) {
    ranges = raw.rangeStr.split(';').map((part: string) => {
      const [start, end] = part.split('-').map(n => parseInt(n, 10));
      return [isNaN(start) ? 1 : start, isNaN(end) ? 50 : end] as [number, number];
    });
  } else if (typeof raw.startPage === 'number' && typeof raw.endPage === 'number') {
    ranges = [[raw.startPage, raw.endPage]];
  } else if (Array.isArray(raw.ranges) && raw.ranges.length > 0 && Array.isArray(raw.ranges[0])) {
    ranges = raw.ranges;
  } else {
    ranges = [[1, 50]];
  }

  let portions: StudyPortion[] | undefined;
  if (raw.portionsStr && typeof raw.portionsStr === 'string' && raw.portionsStr.trim()) {
    try {
      portions = JSON.parse(raw.portionsStr);
    } catch {}
  } else if (Array.isArray(raw.portions)) {
    portions = raw.portions;
  }

  return {
    id: raw.id || `${(raw.name || 'sub').toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: raw.name || 'Subject',
    emoji: raw.emoji || '📖',
    hue: typeof raw.hue === 'number' ? raw.hue : 220,
    ranges: ranges.length > 0 ? ranges : [[1, 50]],
    portions,
    targetPages: typeof raw.targetPages === 'number' ? raw.targetPages : (ranges[0] ? Math.max(1, ranges[0][1] - ranges[0][0] + 1) : 50)
  };
}

/**
 * Converts an ExamRecord into a Firestore-safe format without nested arrays.
 */
export function examToFirestore(exam: ExamRecord): Record<string, any> {
  return {
    id: exam.id,
    name: exam.name,
    shortName: exam.shortName,
    examType: exam.id,
    quarter: exam.quarter,
    date: exam.date || '',
    subjects: (exam.subjects || []).map(subjectToFirestore),
    progress: exam.progress || {},
    credited: exam.credited || {}
  };
}

/**
 * Restores an ExamRecord from Firestore.
 */
export function examFromFirestore(raw: any, defaultId: string): ExamRecord {
  const subjects = Array.isArray(raw.subjects) ? raw.subjects.map(subjectFromFirestore) : [];
  return {
    id: raw.id || defaultId,
    name: raw.name || (defaultId === 'fqt' ? 'FQT (First Quarter Test)' : defaultId === 'test2' ? 'Test 2' : 'FE (Final Examination)'),
    shortName: raw.shortName || (defaultId === 'fqt' ? 'FQT' : defaultId === 'test2' ? 'Test 2' : 'FE'),
    examType: (raw.id || defaultId) as any,
    quarter: Number(raw.quarter) || (defaultId === 'fqt' ? 1 : defaultId === 'test2' ? 2 : 4),
    date: raw.date || '',
    subjects,
    progress: raw.progress || {},
    credited: raw.credited || {}
  };
}

/**
 * Serializes AppState into a clean Firestore document payload.
 * Strictly guarantees that no arrays of arrays or arrays of maps with arrays are stored.
 */
export function serializeAcademicForFirestore(state: AppState): Record<string, any> {
  const firestoreExams: Record<string, any> = {};
  if (state.exams && typeof state.exams === 'object') {
    for (const [id, ex] of Object.entries(state.exams)) {
      if (ex && (id === 'fqt' || id === 'test2' || id === 'fe')) {
        firestoreExams[id] = examToFirestore(ex);
      }
    }
  }

  const firestoreUserSubjects = (state.userSubjects || []).map(subjectToFirestore);

  return {
    grade: state.grade || 'Grade 10',
    activeExamId: state.activeExamId || 'fqt',
    examPeriodId: state.examPeriodId || state.activeExamId || 'fqt',
    quarter: state.quarter || 1,
    date: state.date || '',
    xp: state.xp || 0,
    totalPages: state.totalPages || 0,
    bestStreak: state.bestStreak || 0,
    sessions: state.sessions || 0,
    pomodoros: state.pomodoros || 0,
    early: !!state.early,
    hideDone: !!state.hideDone,
    hardest: state.hardest || '',
    rewards: state.rewards || '',
    sound: state.sound !== false,
    socks: state.socks || 0,
    offsets: state.offsets || {},
    days: state.days || {},
    badges: state.badges || {},
    progress: state.progress || {},
    credited: state.credited || {},
    decor: state.decor || {},
    quizBlocklist: state.quizBlocklist || [],
    quiz: state.quiz || [],
    examPeriods: state.examPeriods || [],
    userSubjects: firestoreUserSubjects,
    exams: firestoreExams,
    updatedAt: Date.now()
  };
}

/**
 * Deserializes an academic progress document from Firestore back into AppState.
 */
export function deserializeAcademicFromFirestore(remoteData: any): Partial<AppState> {
  const grade = remoteData.grade || 'Grade 10';
  const defaults = createDefaultExamsForGrade(grade);
  const exams: Record<string, ExamRecord> = {
    fqt: defaults.fqt,
    test2: defaults.test2,
    fe: defaults.fe
  };

  if (remoteData.exams && typeof remoteData.exams === 'object') {
    (['fqt', 'test2', 'fe'] as const).forEach(id => {
      const remoteEx = remoteData.exams[id];
      if (remoteEx) {
        exams[id] = examFromFirestore(remoteEx, id);
      }
    });
  }

  let activeId = remoteData.activeExamId || remoteData.examPeriodId || 'fqt';
  if (!['fqt', 'test2', 'fe'].includes(activeId)) {
    activeId = 'fqt';
  }

  const activeEx = exams[activeId] || exams.fqt || defaults.fqt;

  let userSubjects: Subject[];
  if (Array.isArray(remoteData.userSubjects) && remoteData.userSubjects.length > 0) {
    userSubjects = remoteData.userSubjects.map(subjectFromFirestore);
  } else {
    userSubjects = activeEx.subjects;
  }

  return {
    ...remoteData,
    grade,
    exams,
    activeExamId: activeId,
    examPeriodId: activeId,
    quarter: activeEx.quarter,
    date: activeEx.date,
    userSubjects
  };
}

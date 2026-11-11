import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AppState,
  TimerState,
  Subject,
  BookMeta,
  QuizQuestion,
  QuestionType,
  DayRecord,
  ExamPeriod,
  ExamRecord
} from './types.ts';
import {
  STORAGE_KEY,
  XP_PAGE,
  XP_SESSION,
  XP_SUBJECT,
  XP_BADGE,
  DEFAULT_REWARDS,
  subjects,
  GRADE_10_SUBJECTS,
  DEFAULT_EXAM_PERIODS,
  STANDARD_EXAM_PRESETS,
  getDefaultSubjectsForGrade,
  createDefaultExamsForGrade,
  migrateOrEnsureExams,
  MODES,
  BADGES,
  levelOf,
  rankOf,
  xpFor,
  dayKey,
  todayKey,
  addDays,
  ord,
  byName,
  countFor
} from './constants.ts';
import {
  idbAll,
  getBookPages,
  importBook
} from './quizEngine.ts';
import {
  extractTextbookQuestions,
  selectTextbookQuestions
} from './textbookQuizParser.ts';
import {
  auth,
  db,
  loginWithGoogle,
  logoutUser,
  generateFriendCode,
  IslandData,
  CropData
} from './firebase.ts';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { ThreeIslandGame } from './components/ThreeIslandGame.tsx';
import { FloatingIslandView } from './components/FloatingIslandView.tsx';
import { WorldSkyMap, SkyFriendIsland } from './components/WorldSkyMap.tsx';
import { FriendsDrawer, FriendEntry } from './components/FriendsDrawer.tsx';
import { BeanWardrobeModal } from './components/BeanWardrobeModal.tsx';
import { FarmShopModal } from './components/FarmShopModal.tsx';
import { TextbookQuizModal } from './components/TextbookQuizModal.tsx';
import { ActivityRings } from './components/ActivityRings.tsx';
import { FocusSheet } from './components/FocusSheet.tsx';
import { downloadStandaloneHtml, downloadProjectZip } from './exportStandaloneHtml.ts';
import { PWAInstallButton } from './components/PWAInstallButton.tsx';
import { SubjectManualEditorModal } from './components/SubjectManualEditorModal.tsx';
import { ExamCountdownWidget } from './components/ExamCountdownWidget.tsx';
import {
  serializeAcademicForFirestore,
  deserializeAcademicFromFirestore
} from './firestoreAcademicSync.ts';
import confetti from 'canvas-confetti';
import {
  Flame,
  Sun,
  Moon,
  Download,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  RotateCcw,
  Upload,
  Settings,
  Trophy,
  BarChart3,
  ListOrdered,
  Users,
  Compass,
  Palette,
  ShoppingBag,
  LogIn,
  LogOut,
  UserCheck,
  Bookmark,
  Layers,
  Box,
  GraduationCap,
  Edit2,
  Plus,
  ShieldCheck,
  Trash2
} from 'lucide-react';

function defaultState(grade = 'Grade 10'): AppState {
  const { exams, activeExamId } = migrateOrEnsureExams({ grade });
  const curExam = exams[activeExamId] || Object.values(exams)[0];
  return {
    grade,
    activeExamId,
    exams,
    examPeriodId: activeExamId,
    examPeriods: DEFAULT_EXAM_PERIODS,
    userSubjects: curExam.subjects,
    quarter: curExam.quarter,
    date: curExam.date,
    progress: {},
    credited: {},
    xp: 0,
    totalPages: 0,
    days: {},
    badges: {},
    bestStreak: 0,
    sessions: 0,
    pomodoros: 0,
    early: false,
    hideDone: true,
    hardest: '',
    rewards: DEFAULT_REWARDS,
    sound: true,
    timer: null,
    offsets: {},
    quiz: [],
    quizBlocklist: [],
    socks: 6,
    decor: {}
  };
}

const DEFAULT_ISLAND: IslandData = {
  ownerId: 'local-me',
  ownerName: 'Scholar Explorer',
  islandName: 'Sunflower Isle',
  houseLevel: 1,
  decor: {},
  theme: 'meadow',
  beanOutfit: {
    color: '#eaae70',
    hat: 'beanie',
    accessory: 'scarf'
  }
};

const DEFAULT_CROPS: CropData[] = [
  { id: 'plot-1', ownerId: 'local-me', cropType: 'wheat', stage: 1, waterMinutes: 5 },
  { id: 'plot-2', ownerId: 'local-me', cropType: 'starberry', stage: 2, waterMinutes: 15 },
  { id: 'plot-3', ownerId: 'local-me', cropType: 'moonblossom', stage: 0, waterMinutes: 0 },
  { id: 'plot-4', ownerId: 'local-me', cropType: 'sunflower', stage: 3, waterMinutes: 25 },
  { id: 'plot-5', ownerId: 'local-me', cropType: 'wheat', stage: 2, waterMinutes: 12 },
  { id: 'plot-6', ownerId: 'local-me', cropType: 'starberry', stage: 1, waterMinutes: 6 }
];

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const grade = parsed.grade || 'Grade 10';
        const { exams, activeExamId } = migrateOrEnsureExams(parsed);
        const curExam = exams[activeExamId] || Object.values(exams)[0];
        const examPeriods =
          parsed.examPeriods && parsed.examPeriods.length > 0
            ? parsed.examPeriods
            : DEFAULT_EXAM_PERIODS;
        return {
          ...defaultState(grade),
          ...parsed,
          grade,
          activeExamId,
          exams,
          examPeriodId: activeExamId,
          examPeriods,
          userSubjects: curExam.subjects,
          quarter: curExam.quarter,
          date: curExam.date
        };
      }
    } catch (e) {
      console.error('Failed to load saved state', e);
    }
    return defaultState('Grade 10');
  });

  const [island, setIsland] = useState<IslandData>(() => {
    try {
      const saved = localStorage.getItem('studyquest_island_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_ISLAND;
  });

  const [crops, setCrops] = useState<CropData[]>(() => {
    try {
      const saved = localStorage.getItem('studyquest_crops_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CROPS;
  });

  // Toggle for 3D View vs 2D View (defaulting to the requested 3D World)
  const [view3D, setView3D] = useState<boolean>(true);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'island' | 'today' | 'subjects' | 'quiz' | 'settings'>('island');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // User & Firebase Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friendCode, setFriendCode] = useState<string>(() => {
    return localStorage.getItem('studyquest_friend_code') || generateFriendCode();
  });
  const [friendsList, setFriendsList] = useState<FriendEntry[]>([
    {
      uid: 'luna-ai',
      displayName: 'Luna Starlight',
      friendCode: 'BEAN-882',
      streak: 9,
      houseLevel: 3
    },
    {
      uid: 'abebe-ai',
      displayName: 'Abebe Bikila',
      friendCode: 'BEAN-404',
      streak: 14,
      houseLevel: 2
    },
    {
      uid: 'kenenisa-ai',
      displayName: 'Kenenisa Bekele',
      friendCode: 'BEAN-310',
      streak: 21,
      houseLevel: 2
    }
  ]);

  // Visiting Friend's Island State
  const [visitingFriend, setVisitingFriend] = useState<{
    island: IslandData;
    crops: CropData[];
  } | null>(null);

  // Modals
  const [showSkyMap, setShowSkyMap] = useState(false);
  const [showFriendsDrawer, setShowFriendsDrawer] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showFarmShop, setShowFarmShop] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [selectedSubjectToEdit, setSelectedSubjectToEdit] = useState<Subject | null>(null);

  const [pickIdx, setPickIdx] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const [booksMeta, setBooksMeta] = useState<Record<string, BookMeta>>({});

  // Modals for subjects and genuine textbook quizzes
  const [manualSubjectModal, setManualSubjectModal] = useState<string | null>(null);
  const [manualPageInput, setManualPageInput] = useState<string>('');
  const [bookModalSubject, setBookModalSubject] = useState<string | null>(null);
  const [bookStatusMsg, setBookStatusMsg] = useState<string>('');

  // Active Textbook Examination Practice State
  const [activeTextbookQuiz, setActiveTextbookQuiz] = useState<{
    subject: string;
    questions: QuizQuestion[];
  } | null>(null);

  // Quiz Hub Filter State
  const [quizHubSubject, setQuizHubSubject] = useState<string>('Physics');
  const [quizHubTypeFilter, setQuizHubTypeFilter] = useState<'all' | QuestionType>('all');
  const [quizHubStartPage, setQuizHubStartPage] = useState<number>(1);
  const [quizHubEndPage, setQuizHubEndPage] = useState<number>(100);

  // Dark mode class sync
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Local storage auto-sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('LocalStorage save error', e);
    }
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem('studyquest_island_v1', JSON.stringify(island));
    } catch (e) {}
  }, [island]);

  useEffect(() => {
    try {
      localStorage.setItem('studyquest_crops_v1', JSON.stringify(crops));
    } catch (e) {}
  }, [crops]);

  useEffect(() => {
    try {
      localStorage.setItem('studyquest_friend_code', friendCode);
    } catch (e) {}
  }, [friendCode]);

  // Firebase Auth Listener & Firestore Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      if (user) {
        showToast(`Signed in as ${user.displayName || 'Scholar'} 🌟`);
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          let assignedCode = friendCode;
          if (userSnap.exists() && userSnap.data()?.friendCode) {
            assignedCode = userSnap.data().friendCode;
            setFriendCode(assignedCode);
          } else {
            await setDoc(
              userRef,
              {
                uid: user.uid,
                displayName: user.displayName || 'Scholar Explorer',
                photoURL: user.photoURL || '',
                friendCode: assignedCode,
                updatedAt: Date.now()
              },
              { merge: true }
            );
            await setDoc(doc(db, 'friendCodes', assignedCode), {
              userId: user.uid,
              displayName: user.displayName || 'Scholar Explorer'
            });
          }

          const islandRef = doc(db, 'islands', user.uid);
          const islandSnap = await getDoc(islandRef);
          if (islandSnap.exists()) {
            setIsland(islandSnap.data() as IslandData);
          } else {
            const initialIsland: IslandData = {
              ...island,
              ownerId: user.uid,
              ownerName: user.displayName || 'Scholar Explorer'
            };
            setIsland(initialIsland);
            await setDoc(islandRef, initialIsland);
          }

          const progRef = doc(db, 'users', user.uid, 'progress', 'academic');
          const progSnap = await getDoc(progRef);
          if (progSnap.exists()) {
            const remoteData = progSnap.data();
            const deserialized = deserializeAcademicFromFirestore(remoteData);
            setState(prev => ({
              ...prev,
              ...deserialized
            }));
          } else {
            const payload = serializeAcademicForFirestore(state);
            await setDoc(progRef, payload, { merge: true });
          }
        } catch (err) {
          console.warn('Firestore initial sync notice:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save academic state to Firestore on change if signed in
  useEffect(() => {
    if (currentUser) {
      const progRef = doc(db, 'users', currentUser.uid, 'progress', 'academic');
      const timer = setTimeout(() => {
        try {
          const payload = serializeAcademicForFirestore(state);
          setDoc(progRef, payload, { merge: true }).catch((err) => {
            console.warn('Academic cloud sync notice:', err);
          });
        } catch (err) {
          console.warn('Failed to serialize academic state for cloud sync:', err);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state, currentUser]);

  // Save island to cloud on change if signed in
  useEffect(() => {
    if (currentUser) {
      try {
        const islandRef = doc(db, 'islands', currentUser.uid);
        setDoc(islandRef, island, { merge: true }).catch(() => {});
      } catch (e) {}
    }
  }, [island, currentUser]);

  // Load books metadata from IndexedDB
  useEffect(() => {
    idbAll<BookMeta>('meta')
      .then(items => {
        const map: Record<string, BookMeta> = {};
        items.forEach(m => {
          if (m && m.subject) map[m.subject] = m;
        });
        setBooksMeta(map);
      })
      .catch(() => {});
  }, []);

  const playBeep = () => {
    if (!state.sound) return;
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      [0, 0.28, 0.56].forEach((d, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const t = ctx.currentTime + d;
        osc.type = 'sine';
        osc.frequency.value = i === 2 ? 988 : 784;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.27);
      });
    } catch (e) {}
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMsg(null), 3500);
  };

  // Multi-Grade & Dynamic Syllabus resolution (Strict isolation of Test 2 vs FQT vs other exams)
  const activeExam: ExamRecord = useMemo(() => {
    const list = state.exams && Object.keys(state.exams).length > 0
      ? state.exams
      : createDefaultExamsForGrade(state.grade || 'Grade 10');
    const examId = state.activeExamId || 'test2';
    return list[examId] || Object.values(list)[0] || createDefaultExamsForGrade('Grade 10').test2;
  }, [state.exams, state.activeExamId, state.grade]);

  // Current Subjects belonging EXCLUSIVELY to the active examination
  const currentSubjects: Subject[] = useMemo(() => {
    if (activeExam && activeExam.subjects && activeExam.subjects.length > 0) {
      return activeExam.subjects;
    }
    return subjects;
  }, [activeExam]);

  const currentExam = activeExam;
  const currentQuarter = activeExam.quarter;

  const handleSwitchExam = (examId: string) => {
    const target = state.exams[examId];
    if (!target) return;
    setState(prev => ({
      ...prev,
      activeExamId: examId,
      examPeriodId: examId,
      quarter: target.quarter,
      date: target.date,
      userSubjects: target.subjects
    }));
    showToast(`Switched to ${target.name} 📚`);
  };

  const handleSelectGrade = (newGrade: string) => {
    if (!newGrade || newGrade === state.grade) return;
    const newExams = createDefaultExamsForGrade(newGrade);
    const activeId = (state.activeExamId || 'fqt') as 'fqt' | 'test2' | 'fe';
    const curExam = newExams[activeId] || newExams.fqt || Object.values(newExams)[0];

    setState(prev => ({
      ...prev,
      grade: newGrade,
      exams: newExams,
      activeExamId: curExam.id,
      examPeriodId: curExam.id,
      quarter: curExam.quarter,
      date: curExam.date,
      userSubjects: curExam.subjects,
      progress: {},
      credited: {}
    }));
    showToast(`Switched to ${newGrade}! Loaded default syllabus 🎓`);
  };

  const handleUpdateExamDate = (examId: string, newDate: string) => {
    setState(prev => {
      const curEx = prev.exams?.[examId];
      if (!curEx) return prev;
      const updatedEx = { ...curEx, date: newDate };
      const updatedExams = { ...prev.exams, [examId]: updatedEx };
      const updatedPeriods = (prev.examPeriods || DEFAULT_EXAM_PERIODS).map(p =>
        p.id === examId ? { ...p, date: newDate } : p
      );
      return {
        ...prev,
        date: prev.activeExamId === examId ? newDate : prev.date,
        exams: updatedExams,
        examPeriods: updatedPeriods
      };
    });
    showToast(`Exam date updated to ${newDate} 📅`);
  };

  const getSubjectByName = (name: string): Subject => {
    return currentSubjects.find(s => s.name === name) || currentSubjects[0];
  };

  const rangeFor = (s: Subject): [number, number] => {
    if (!s || !s.ranges || s.ranges.length === 0) return [1, 50];
    return s.ranges[0] || [1, 50];
  };

  const keyFor = (name: string) => `${activeExam.id}|${name}`;

  const lastEffective = (s: Subject) => {
    const name = s.name;
    const r = rangeFor(s);
    const examProg = activeExam.progress?.[name];
    if (typeof examProg === 'number') {
      return Math.max(r[0] - 1, Math.min(r[1], examProg));
    }
    const legacyKey = `${currentQuarter}|${name}`;
    const legacyVal = state.progress?.[legacyKey] ?? state.progress?.[name];
    if (typeof legacyVal === 'number') {
      return Math.max(r[0] - 1, Math.min(r[1], legacyVal));
    }
    return r[0] - 1;
  };

  const studiedCount = (s: Subject) => {
    const name = s.name;
    const r = rangeFor(s);
    const examCred = activeExam.credited?.[name];
    if (typeof examCred === 'number') {
      return Math.max(0, Math.min(countFor(r), examCred));
    }
    const legacyKey = `${currentQuarter}|${name}`;
    const legacyVal = state.credited?.[legacyKey] ?? state.credited?.[name];
    if (typeof legacyVal === 'number') {
      return Math.max(0, Math.min(countFor(r), legacyVal));
    }
    return 0;
  };

  const isFinished = (s: Subject) => studiedCount(s) >= countFor(rangeFor(s));

  const overall = useMemo(() => {
    let total = 0;
    let covered = 0;
    currentSubjects.forEach(s => {
      total += countFor(rangeFor(s));
      covered += studiedCount(s);
    });
    return {
      total,
      covered,
      remaining: total - covered,
      pct: total ? Math.round((covered / total) * 100) : 0
    };
  }, [state.progress, currentQuarter, currentSubjects]);

  const smartList = useMemo(() => {
    return currentSubjects
      .map(s => {
        const c = countFor(rangeFor(s));
        const st = studiedCount(s);
        return { s, pct: st / c, left: c - st };
      })
      .filter(x => x.left > 0)
      .sort((a, b) => a.pct - b.pct || b.left - a.left)
      .map(x => x.s);
  }, [state.progress, currentQuarter, currentSubjects]);

  const streakInfo = useMemo(() => {
    const todayStr = todayKey();
    const todayDone = !!state.days[todayStr] && (state.days[todayStr].p > 0 || state.days[todayStr].s > 0);
    let d = new Date();
    d.setHours(12, 0, 0, 0);
    if (!todayDone) d = addDays(d, -1);
    let n = 0;
    while (state.days[dayKey(d)] && (state.days[dayKey(d)].p > 0 || state.days[dayKey(d)].s > 0)) {
      n++;
      d = addDays(d, -1);
    }
    return { n, todayDone };
  }, [state.days]);

  const targetInfo = useMemo(() => {
    if (!state.date) return null;
    const t = new Date(state.date + 'T00:00:00');
    const n = new Date();
    n.setHours(0, 0, 0, 0);
    const days = Math.round((t.getTime() - n.getTime()) / 86400000);
    if (!Number.isFinite(days)) return null;
    if (days < 0) return { past: true, days };

    const q = currentQuarter;
    const pagesToday = (state.days[todayKey()]?.q || {})[q] || 0;
    if (overall.remaining === 0 && pagesToday === 0) {
      return { days, finished: true, target: 0, pagesToday };
    }
    const studyDays = Math.max(1, days);
    const target = Math.ceil((overall.remaining + pagesToday) / studyDays);
    let prev = 0;
    for (let i = 1; i <= 7; i++) {
      prev += state.days[dayKey(addDays(new Date(), -i))]?.p || 0;
    }
    const avg = prev / 7;
    const done = pagesToday >= target;
    return {
      days,
      studyDays,
      target,
      pagesToday,
      left: Math.max(0, target - pagesToday),
      done,
      avg,
      onTrack: done || avg >= target,
      rem: overall.remaining
    };
  }, [state.date, currentQuarter, overall, state.days]);

  const currentLevel = levelOf(state.xp);
  const currentRank = rankOf(currentLevel);
  const xpCur = state.xp - xpFor(currentLevel);
  const xpSpan = xpFor(currentLevel + 1) - xpFor(currentLevel);

  const checkBadges = (newTotalPages: number, newSessions: number, newPomos: number, newXp: number) => {
    const fin = currentSubjects.filter(isFinished).length;
    const stats = {
      pages: newTotalPages,
      fin,
      streak: Math.max(streakInfo.n, state.bestStreak),
      early: state.early,
      sessions: newSessions,
      pomos: newPomos,
      pct: overall.pct
    };

    const newBadges = { ...state.badges };
    let addedXp = 0;
    BADGES.forEach(b => {
      if (!newBadges[b.id] && b.t(stats)) {
        newBadges[b.id] = todayKey();
        addedXp += XP_BADGE;
        showToast(`🏆 Badge Unlocked: ${b.n}! +${XP_BADGE} XP`);
      }
    });

    return { newBadges, addedXp };
  };

  // Progress Logging (strictly isolated to active examination)
  const setLastPage = (subjectName: string, n: number) => {
    const s = getSubjectByName(subjectName);
    if (!s) return;
    const r = rangeFor(s);
    const prevStudied = studiedCount(s);
    const safeN = Math.max(r[0] - 1, Math.min(r[1], n));

    const newStudied = Math.max(0, Math.min(countFor(r), safeN - r[0] + 1));
    const gain = Math.max(0, newStudied - prevStudied);

    setState(prev => {
      const activeId = prev.activeExamId || 'test2';
      const curExam = prev.exams[activeId] || activeExam;

      const updatedProgress = {
        ...(curExam.progress || {}),
        [subjectName]: safeN
      };
      const updatedCredited = {
        ...(curExam.credited || {}),
        [subjectName]: newStudied
      };

      const updatedExam: ExamRecord = {
        ...curExam,
        progress: updatedProgress,
        credited: updatedCredited
      };

      const updatedExams = {
        ...prev.exams,
        [activeId]: updatedExam
      };

      const legacyKey = `${curExam.quarter}|${subjectName}`;
      const todayK = todayKey();
      const existingToday = prev.days[todayK] || { p: 0, q: {}, s: 0, m: 0 };
      const q = curExam.quarter;

      const updatedToday: DayRecord = {
        ...existingToday,
        p: existingToday.p + gain,
        q: {
          ...existingToday.q,
          [q]: (existingToday.q[q] || 0) + gain
        }
      };

      let newXp = prev.xp + gain * XP_PAGE;
      const newTotalPages = prev.totalPages + gain;

      if (prevStudied < countFor(r) && newStudied >= countFor(r)) {
        newXp += XP_SUBJECT;
        showToast(`🎉 ${subjectName} completed for ${curExam.shortName}! +${XP_SUBJECT} XP`);
      }

      const { newBadges, addedXp } = checkBadges(newTotalPages, prev.sessions, prev.pomodoros, newXp);
      newXp += addedXp;

      return {
        ...prev,
        exams: updatedExams,
        progress: { ...prev.progress, [legacyKey]: safeN, [subjectName]: safeN },
        credited: { ...prev.credited, [legacyKey]: newStudied, [subjectName]: newStudied },
        totalPages: newTotalPages,
        xp: newXp,
        days: { ...prev.days, [todayK]: updatedToday },
        badges: newBadges
      };
    });

    if (gain > 0) {
      showToast(`${s.emoji} ${subjectName} +${gain} page${gain > 1 ? 's' : ''} (Page ${safeN}) in ${activeExam.shortName} · +${gain * XP_PAGE} XP`);
      waterCrops(gain * 2);
    } else {
      showToast(`${subjectName}: Saved page ${safeN} (${activeExam.shortName})`);
    }
  };

  const quickAdd = (subjectName: string, amount: number) => {
    const s = getSubjectByName(subjectName);
    if (!s) return;
    const r = rangeFor(s);
    const current = lastEffective(s);
    if (current >= r[1]) {
      showToast(`${subjectName} is already 100% finished in ${activeExam.shortName}! 🎉`);
      return;
    }
    const target = Math.min(r[1], current + amount);
    setLastPage(subjectName, target);
  };

  // Manual Subject and Portion Management (Strictly isolated per examination)
  const handleSaveSubject = (updated: Subject, originalName?: string) => {
    setState(prev => {
      const activeId = (prev.activeExamId || 'fqt') as 'fqt' | 'test2' | 'fe';
      const curExam = prev.exams[activeId] || activeExam;
      const currentList = curExam.subjects || [];
      const matchName = originalName || updated.name;
      const index = currentList.findIndex(s => s.name === matchName || (s.id && s.id === updated.id));
      let nextList: Subject[];
      if (index >= 0) {
        nextList = [...currentList];
        nextList[index] = updated;
      } else {
        nextList = [...currentList, updated];
      }

      // If renamed, migrate progress keys within this examination
      const updatedProgress = { ...(curExam.progress || {}) };
      const updatedCredited = { ...(curExam.credited || {}) };
      if (originalName && originalName !== updated.name) {
        if (updatedProgress[originalName] !== undefined) {
          updatedProgress[updated.name] = updatedProgress[originalName];
          delete updatedProgress[originalName];
        }
        if (updatedCredited[originalName] !== undefined) {
          updatedCredited[updated.name] = updatedCredited[originalName];
          delete updatedCredited[originalName];
        }
      }

      const updatedExam: ExamRecord = {
        ...curExam,
        subjects: nextList,
        progress: updatedProgress,
        credited: updatedCredited
      };

      return {
        ...prev,
        exams: {
          ...prev.exams,
          [activeId]: updatedExam
        },
        userSubjects: nextList
      };
    });
    showToast(`Saved ${updated.name} for ${activeExam.shortName}! 📚`);
  };

  const handleDeleteSubject = (subjectName: string) => {
    setState(prev => {
      const activeId = (prev.activeExamId || 'fqt') as 'fqt' | 'test2' | 'fe';
      const curExam = prev.exams[activeId] || activeExam;

      const nextList = curExam.subjects.filter(s => s.name !== subjectName);
      const updatedProgress = { ...(curExam.progress || {}) };
      delete updatedProgress[subjectName];
      const updatedCredited = { ...(curExam.credited || {}) };
      delete updatedCredited[subjectName];

      const updatedExam: ExamRecord = {
        ...curExam,
        subjects: nextList,
        progress: updatedProgress,
        credited: updatedCredited
      };

      return {
        ...prev,
        exams: {
          ...prev.exams,
          [activeId]: updatedExam
        },
        userSubjects: nextList
      };
    });
    showToast(`Removed ${subjectName} from ${activeExam.shortName}.`);
  };

  // Farm Crop Watering Mechanics
  const waterCrops = (waterMinutesToAdd: number) => {
    setCrops(prevCrops =>
      prevCrops.map(c => {
        const newWater = c.waterMinutes + waterMinutesToAdd;
        let newStage = c.stage;
        if (newWater >= 20) newStage = 3;
        else if (newWater >= 10) newStage = Math.max(2, c.stage);
        else if (newWater >= 4) newStage = Math.max(1, c.stage);
        return {
          ...c,
          waterMinutes: newWater,
          stage: newStage
        };
      })
    );
  };

  // Harvesting crops
  const handleHarvestCrop = (plotId: string) => {
    const plot = crops.find(c => c.id === plotId);
    if (!plot) return;

    if (plot.stage === 3) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
      setState(prev => ({
        ...prev,
        xp: prev.xp + 15,
        socks: prev.socks + 2
      }));
      setCrops(prev =>
        prev.map(c =>
          c.id === plotId ? { ...c, stage: 0, waterMinutes: 0 } : c
        )
      );
      showToast(`🌾 Harvested golden ${plot.cropType}! +15 XP · +2 Socks 🧦`);
    } else {
      showToast(`Keep studying to water this ${plot.cropType}! Stage: ${plot.stage}/3 🌱`);
    }
  };

  const handlePlantCrop = (plotId: string) => {
    setShowFarmShop(true);
  };

  // Study Timer Logic
  const startTimer = (subjectName: string, mode: 'sprint' | 'pomodoro' | 'hardest', round = 1) => {
    const s = getSubjectByName(subjectName);
    if (!s) return;
    const r = rangeFor(s);
    const base = lastEffective(s);
    const m = MODES[mode];

    const newTimer: TimerState = {
      mode,
      phase: 'work',
      stage: 'running',
      subject: subjectName,
      total: m.work * 60000,
      startedAt: Date.now(),
      endsAt: Date.now() + m.work * 60000,
      left: null,
      round,
      goalA: base + 1,
      goalB: Math.min(r[1], base + 5),
      startStudied: studiedCount(s),
      full: false,
      mins: 0,
      reward: '',
      slips: 0,
      hiddenAt: null,
      sadUntil: 0,
      socks: 0
    };

    setState(prev => ({ ...prev, timer: newTimer }));
  };

  const handleTimerFinishWork = (full: boolean) => {
    const t = state.timer;
    if (!t) return;
    const left = full ? 0 : t.stage === 'running' ? Math.max(0, (t.endsAt || 0) - Date.now()) : t.left || 0;
    const mins = Math.round((t.total - left) / 60000);

    const rewardsList = state.rewards.split(',').map(x => x.trim()).filter(Boolean);
    const randomReward = rewardsList.length ? rewardsList[Math.floor(Math.random() * rewardsList.length)] : '';
    const earnedSocks = full ? Math.max(1, 3 - (t.slips || 0)) : 0;

    waterCrops(mins);

    setState(prev => {
      const todayK = todayKey();
      const existingToday = prev.days[todayK] || { p: 0, q: {}, s: 0, m: 0 };
      const updatedToday = {
        ...existingToday,
        m: existingToday.m + mins,
        s: existingToday.s + (full ? 1 : 0)
      };

      const newSessions = prev.sessions + (full ? 1 : 0);
      const newPomos = prev.pomodoros + (full && t.mode === 'pomodoro' ? 1 : 0);
      let newXp = prev.xp + (full ? XP_SESSION : 0);

      const { newBadges, addedXp } = checkBadges(prev.totalPages, newSessions, newPomos, newXp);
      newXp += addedXp;

      const updatedTimer: TimerState = {
        ...t,
        stage: 'done',
        full,
        mins,
        endsAt: null,
        left: null,
        reward: full ? randomReward : '',
        socks: earnedSocks
      };

      return {
        ...prev,
        xp: newXp,
        socks: prev.socks + earnedSocks,
        sessions: newSessions,
        pomodoros: newPomos,
        days: { ...prev.days, [todayK]: updatedToday },
        badges: newBadges,
        timer: updatedTimer
      };
    });

    if (full) {
      playBeep();
      showToast(`🎉 Round Complete! +${XP_SESSION} XP · +${earnedSocks} 🧦 · Crops watered 💧`);
    }
  };

  // Timer Tick listener
  useEffect(() => {
    if (!state.timer || state.timer.stage !== 'running') return;
    const interval = setInterval(() => {
      const t = state.timer;
      if (!t || t.stage !== 'running') return;
      const left = (t.endsAt || 0) - Date.now();
      if (left <= 0) {
        if (t.phase === 'work') {
          handleTimerFinishWork(true);
        } else {
          playBeep();
          setState(prev =>
            prev.timer
              ? {
                  ...prev,
                  timer: { ...prev.timer, stage: 'done', endsAt: null, left: null }
                }
              : prev
          );
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [state.timer]);

  // Genuine Textbook Quiz Launcher
  const launchTextbookQuiz = async (
    subjectName: string,
    fromPage?: number,
    toPage?: number,
    typeFilter: 'all' | QuestionType = 'all'
  ) => {
    const s = byName(subjectName);
    if (!s) return;
    const r = rangeFor(s);
    const startP = Math.max(r[0], fromPage != null ? fromPage : r[0]);
    const endP = Math.min(r[1], toPage != null ? toPage : lastEffective(s));

    try {
      const pages = await getBookPages(subjectName);
      const offset = state.offsets[subjectName] || 1;

      // Extract ONLY genuine textbook review & exercise questions
      const allExtracted = extractTextbookQuestions(subjectName, pages, offset);

      if (!allExtracted || allExtracted.length === 0) {
        showToast(`No exercise or review questions detected in ${subjectName}. Check if PDF has text.`);
        setBookModalSubject(subjectName);
        return;
      }

      const selected = selectTextbookQuestions(allExtracted, startP, endP, {
        count: 8,
        typeFilter
      });

      if (!selected.length) {
        // Fallback to all questions from the textbook
        const fallback = selectTextbookQuestions(allExtracted, 1, 999, { count: 8, typeFilter });
        setActiveTextbookQuiz({
          subject: subjectName,
          questions: fallback
        });
        return;
      }

      setActiveTextbookQuiz({
        subject: subjectName,
        questions: selected
      });
    } catch (e) {
      setBookModalSubject(subjectName);
      setBookStatusMsg(`Please select or calibrate the PDF textbook for ${subjectName} first.`);
    }
  };

  // Visiting a friend's island
  const handleVisitFriend = async (friendUid: string) => {
    try {
      showToast(`🎈 Flying Hot Air Balloon to friend's island...`);
      setShowFriendsDrawer(false);
      setShowSkyMap(false);

      if (friendUid.includes('-ai')) {
        const friend = friendsList.find(f => f.uid === friendUid);
        const name = friend?.displayName || 'Fellow Explorer';
        setVisitingFriend({
          island: {
            ownerId: friendUid,
            ownerName: name,
            islandName: `${name.split(' ')[0]}’s Sanctuary`,
            houseLevel: friend?.houseLevel || 2,
            decor: { well: true, swing: true },
            theme: 'meadow',
            beanOutfit: {
              color: '#7dd3fc',
              hat: friend?.houseLevel === 3 ? 'crown' : 'straw',
              accessory: 'bag'
            }
          },
          crops: [
            { id: 'f-1', ownerId: friendUid, cropType: 'sunflower', stage: 3, waterMinutes: 25 },
            { id: 'f-2', ownerId: friendUid, cropType: 'moonblossom', stage: 2, waterMinutes: 18 },
            { id: 'f-3', ownerId: friendUid, cropType: 'starberry', stage: 3, waterMinutes: 20 },
            { id: 'f-4', ownerId: friendUid, cropType: 'wheat', stage: 3, waterMinutes: 22 },
            { id: 'f-5', ownerId: friendUid, cropType: 'sunflower', stage: 2, waterMinutes: 14 },
            { id: 'f-6', ownerId: friendUid, cropType: 'starberry', stage: 3, waterMinutes: 24 }
          ]
        });
        setActiveTab('island');
      } else {
        const islandSnap = await getDoc(doc(db, 'islands', friendUid));
        if (islandSnap.exists()) {
          const friendIsland = islandSnap.data() as IslandData;
          setVisitingFriend({
            island: friendIsland,
            crops: DEFAULT_CROPS
          });
          setActiveTab('island');
        } else {
          showToast('Could not load this island. Friend might still be building it!');
        }
      }
    } catch (err) {
      showToast('Could not visit island right now.');
    }
  };

  // Adding friend via code
  const handleAddFriend = async (code: string): Promise<boolean> => {
    try {
      if (code === friendCode) {
        showToast("That's your own Friend Code! 😊");
        return false;
      }
      const codeSnap = await getDoc(doc(db, 'friendCodes', code));
      if (codeSnap.exists()) {
        const data = codeSnap.data();
        const newEntry: FriendEntry = {
          uid: data.userId,
          displayName: data.displayName || 'Scholar Friend',
          friendCode: code,
          streak: 5,
          houseLevel: 2
        };
        setFriendsList(prev => [...prev.filter(f => f.friendCode !== code), newEntry]);
        showToast(`Added ${newEntry.displayName} as a friend! 🤝`);
        return true;
      } else {
        const newEntry: FriendEntry = {
          uid: `player-${code.toLowerCase()}`,
          displayName: `Friend ${code}`,
          friendCode: code,
          streak: Math.floor(2 + Math.random() * 10),
          houseLevel: Math.floor(1 + Math.random() * 2)
        };
        setFriendsList(prev => [...prev.filter(f => f.friendCode !== code), newEntry]);
        showToast(`Connected to ${newEntry.displayName}! 🎈`);
        return true;
      }
    } catch (e) {
      return false;
    }
  };

  // Weekly Activity 7-Day Chart
  const weeklyDays = useMemo(() => {
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    const daysArr: { label: string; long: string; pages: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(noon, -i);
      const k = dayKey(d);
      const rec = state.days[k] || { p: 0, q: {}, s: 0, m: 0 };
      daysArr.push({
        label: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }),
        long: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'long' }),
        pages: rec.p,
        isToday: i === 0
      });
    }
    return daysArr;
  }, [state.days]);

  const maxWeeklyPage = Math.max(5, targetInfo?.target || 0, ...weeklyDays.map(d => d.pages));

  const skyFriendsList: SkyFriendIsland[] = useMemo(() => {
    return friendsList.map((f, i) => {
      const angle = (i / friendsList.length) * Math.PI * 2;
      return {
        id: f.uid,
        ownerName: f.displayName,
        islandName: `${f.displayName.split(' ')[0]}’s Isle`,
        streak: f.streak,
        houseLevel: f.houseLevel,
        cropCount: 6,
        x: 50 + Math.cos(angle) * 35,
        y: 50 + Math.sin(angle) * 30
      };
    });
  }, [friendsList]);

  return (
    <div className="min-h-screen bg-[#FBF8F2] dark:bg-[#1A1715] text-[#2B2118] dark:text-[#F4EFE6] flex flex-col font-sans transition-colors duration-200">
      {/* Warm Handcrafted Journal Top Bar */}
      <header className="sticky top-0 z-40 journal-panel px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setVisitingFriend(null);
              setActiveTab('island');
            }}
            className="flex items-center gap-2.5 text-left focus:outline-hidden group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-2xl bg-[#C15C3D] dark:bg-[#C15C3D] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
              SQ
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-serif font-bold tracking-tight text-[#2B2118] dark:text-[#F4EFE6] leading-tight flex items-center gap-1.5">
                Study Quest
                <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-[#E8EFE8] dark:bg-[#233325] text-[#4F6F52] dark:text-[#A3CCA6]">
                  Journal
                </span>
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('subjects');
                }}
                className="text-[11px] font-sans font-medium text-[#6E6256] dark:text-[#ACA195] hover:text-[#C15C3D] dark:hover:text-[#E07A5F] transition-colors cursor-pointer flex items-center gap-1"
                title="Click to view examination portions"
              >
                <span>{state.grade || 'Grade 10'} · {currentExam?.name || `${ord(currentQuarter)} Quarter`}</span>
                <span className="text-[9px] opacity-70">📖</span>
              </span>
            </div>
          </button>
        </div>

        {/* Top Badges & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Persistent Grade Selector Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-1.5 h-8 pl-2.5 pr-6 rounded-full bg-[#F4EFE6] hover:bg-[#EAE4D9] dark:bg-[#2A2521] dark:hover:bg-[#342F2A] border border-[#E6DFD5] dark:border-[#3D352E] text-[#2B2118] dark:text-[#F4EFE6] text-xs font-bold transition-all">
              <GraduationCap className="w-3.5 h-3.5 text-[#C15C3D] dark:text-[#E07A5F] shrink-0" />
              <select
                value={state.grade || 'Grade 10'}
                onChange={(e) => handleSelectGrade(e.target.value)}
                className="bg-transparent text-xs font-bold cursor-pointer appearance-none focus:outline-hidden pr-0.5 text-[#2B2118] dark:text-[#F4EFE6]"
                title="Select student grade level — resets subjects & exam schedules to grade syllabus"
              >
                <option value="Grade 6" className="text-[#2B2118] bg-[#FBF8F2] dark:text-[#F4EFE6] dark:bg-[#24201D]">Grade 6</option>
                <option value="Grade 7" className="text-[#2B2118] bg-[#FBF8F2] dark:text-[#F4EFE6] dark:bg-[#24201D]">Grade 7</option>
                <option value="Grade 8" className="text-[#2B2118] bg-[#FBF8F2] dark:text-[#F4EFE6] dark:bg-[#24201D]">Grade 8</option>
                <option value="Grade 9" className="text-[#2B2118] bg-[#FBF8F2] dark:text-[#F4EFE6] dark:bg-[#24201D]">Grade 9</option>
                <option value="Grade 10" className="text-[#2B2118] bg-[#FBF8F2] dark:text-[#F4EFE6] dark:bg-[#24201D]">Grade 10</option>
                <option value="Grade 11 (Natural Science)" className="text-[#2B2118] bg-[#FBF8F2] dark:text-[#F4EFE6] dark:bg-[#24201D]">Grade 11 (Natural)</option>
                <option value="Grade 11 (Social Science)" className="text-[#2B2118] bg-[#FBF8F2] dark:text-[#F4EFE6] dark:bg-[#24201D]">Grade 11 (Social)</option>
                <option value="Grade 12 (Natural Science)" className="text-[#2B2118] bg-[#FBF8F2] dark:text-[#F4EFE6] dark:bg-[#24201D]">Grade 12 (Natural)</option>
                <option value="Grade 12 (Social Science)" className="text-[#2B2118] bg-[#FBF8F2] dark:text-[#F4EFE6] dark:bg-[#24201D]">Grade 12 (Social)</option>
              </select>
            </div>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-[#C15C3D] dark:text-[#E07A5F]">▼</span>
          </div>

          {/* Quick Exam Switcher Dropdown (Strictly FQT, Test 2, FE) */}
          <div className="relative">
            <select
              value={activeExam.id}
              onChange={(e) => {
                if (e.target.value === '__add__') {
                  setSelectedSubjectToEdit(null);
                  setSubjectModalOpen(true);
                  setActiveTab('subjects');
                } else {
                  handleSwitchExam(e.target.value);
                }
              }}
              className="h-8 pl-2.5 pr-7 rounded-full bg-[#E8EFE8] hover:bg-[#DCE7DB] dark:bg-[#233325] dark:hover:bg-[#2A3F2D] border border-[#D5E2D4] dark:border-[#2F4732] text-[#335336] dark:text-[#A3CCA6] text-xs font-bold cursor-pointer appearance-none transition-all focus:outline-hidden"
              title="Switch active examination (FQT, Test 2, or FE)"
            >
              {(['fqt', 'test2', 'fe'] as const).map(id => {
                const ex = state.exams?.[id];
                if (!ex) return null;
                return (
                  <option key={ex.id} value={ex.id} className="text-[#2B2118] bg-[#FBF8F2] dark:text-[#F4EFE6] dark:bg-[#24201D]">
                    {ex.shortName || ex.name}
                  </option>
                );
              })}
              <option value="__add__" className="text-[#C15C3D] font-bold bg-[#FBF8F2] dark:bg-[#24201D]">
                + Add Subject...
              </option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-[#335336] dark:text-[#A3CCA6]">▼</span>
          </div>

          {/* Flame Streak Chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FDF4E7] dark:bg-[#32261C] border border-[#F4E3C7] dark:border-[#4B3929] text-[#B86B12] dark:text-[#F3BA63] text-xs font-bold">
            <Flame className="w-3.5 h-3.5 fill-current text-[#C15C3D]" />
            <span>{streakInfo.n} {streakInfo.n === 1 ? 'day' : 'days'}</span>
          </div>

          {/* Warm Socks Pill */}
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E] text-[#6E6256] dark:text-[#ACA195] text-xs font-bold" title="Handcrafted warm socks knit by Bean">
            <span>🧦</span>
            <span>{state.socks}</span>
          </div>

          {/* Google Auth Pill */}
          {currentUser ? (
            <button
              onClick={() => logoutUser()}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4EFE6] hover:bg-[#EAE4D9] dark:bg-[#2A2521] dark:hover:bg-[#342F2A] text-[#2B2118] dark:text-[#F4EFE6] text-xs font-semibold transition-all border border-[#E6DFD5] dark:border-[#3D352E]"
              title="Sign Out of Firebase Cloud"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#4F6F52]" />
              <span className="max-w-[80px] truncate">{currentUser.displayName?.split(' ')[0] || 'Scholar'}</span>
              <LogOut className="w-3 h-3 text-[#6E6256]" />
            </button>
          ) : (
            <button
              onClick={async () => {
                try {
                  await loginWithGoogle();
                } catch (e) {
                  showToast('Google Sign In cancelled or interrupted.');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2B2118] hover:bg-[#3D3024] dark:bg-[#F4EFE6] dark:hover:bg-[#FFFFFF] active:scale-95 text-[#F4EFE6] dark:text-[#2B2118] text-xs font-bold transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton variant="compact" />

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-8 h-8 rounded-full bg-[#F4EFE6] dark:bg-[#2A2521] hover:bg-[#EAE4D9] dark:hover:bg-[#342F2A] text-[#2B2118] dark:text-[#F4EFE6] flex items-center justify-center transition-colors border border-[#E6DFD5] dark:border-[#3D352E] cursor-pointer"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-[#F3BA63]" /> : <Moon className="w-3.5 h-3.5 text-[#6E6256]" />}
          </button>

          {/* Standalone HTML Downloader Button */}
          <button
            onClick={downloadStandaloneHtml}
            className="px-2.5 py-1.5 rounded-full bg-[#F4EFE6] hover:bg-[#EAE4D9] dark:bg-[#2A2521] dark:hover:bg-[#342F2A] border border-[#E6DFD5] dark:border-[#3D352E] text-[#2B2118] dark:text-[#F4EFE6] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Download offline single-file HTML for Android Chrome"
          >
            <Download className="w-3.5 h-3.5 text-[#6E6256]" />
            <span className="hidden md:inline">Save</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 pb-28 flex flex-col gap-6">
        {/* TAB 1: 3D FLOATING SKY ISLAND & COZY FARM (Centerpiece) */}
        {activeTab === 'island' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Top Island Bar with 3D/2D View Mode Switcher */}
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🏝️</span>
                  <span>{visitingFriend ? `${visitingFriend.island.ownerName}’s Island` : island.islandName}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {visitingFriend ? 'Spectator Mode · Protected crops' : 'Tap ground to walk Bean · Tap crops to harvest'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView3D(!view3D)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border border-slate-200 dark:border-white/10"
                  title="Toggle 3D WebGL vs 2D Cozy Vector Scene"
                >
                  {view3D ? <Box className="w-3.5 h-3.5 text-blue-500" /> : <Layers className="w-3.5 h-3.5 text-emerald-500" />}
                  <span>{view3D ? '3D Game' : '2D Meadow'}</span>
                </button>
              </div>
            </div>

            {/* Visiting Friend Banner if visiting */}
            {visitingFriend && (
              <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-2 border-amber-400 bg-amber-500/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎈</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                      Visiting {visitingFriend.island.ownerName}’s Island
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Safe spectator mode: friends cannot alter or harvest your crops!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setVisitingFriend(null)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20"
                >
                  Return to My Island
                </button>
              </div>
            )}

            {/* 3D WebGL Scene or 2D Vector Meadow */}
            {view3D ? (
              <ThreeIslandGame
                island={visitingFriend ? visitingFriend.island : island}
                crops={visitingFriend ? visitingFriend.crops : crops}
                isVisiting={!!visitingFriend}
                onHarvestCrop={handleHarvestCrop}
                onPlantCrop={handlePlantCrop}
                onWaterSoil={() => {
                  waterCrops(5);
                  showToast('💧 Dew sprinkled on your 3D farm plots!');
                }}
                onReturnHome={() => setVisitingFriend(null)}
                onOpenWardrobe={() => setShowWardrobe(true)}
                onOpenShop={() => setShowFarmShop(true)}
                onOpenMap={() => setShowSkyMap(true)}
                onOpenFriends={() => setShowFriendsDrawer(true)}
                studyMinutesToday={state.days[todayKey()]?.m || 0}
              />
            ) : (
              <FloatingIslandView
                island={visitingFriend ? visitingFriend.island : island}
                crops={visitingFriend ? visitingFriend.crops : crops}
                isVisiting={!!visitingFriend}
                onHarvestCrop={handleHarvestCrop}
                onPlantCrop={handlePlantCrop}
                onWaterSoil={() => {
                  waterCrops(5);
                  showToast('💧 Dew sprinkled on your farm plots!');
                }}
                onReturnHome={() => setVisitingFriend(null)}
                onOpenWardrobe={() => setShowWardrobe(true)}
                onOpenShop={() => setShowFarmShop(true)}
                onOpenMap={() => setShowSkyMap(true)}
                onOpenFriends={() => setShowFriendsDrawer(true)}
                studyMinutesToday={state.days[todayKey()]?.m || 0}
              />
            )}

            {/* Quick Study Launch Deck directly under Island */}
            {!visitingFriend && (
              <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center text-2xl shrink-0">
                    ⏱️
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Study to Water Your Farm
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Every focus minute makes crops flourish into golden harvests.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      const next = smartList[0] || currentSubjects[0];
                      startTimer(next.name, 'sprint');
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" /> 10-Min Sprint
                  </button>
                  <button
                    onClick={() => {
                      const next = smartList[0] || currentSubjects[0];
                      startTimer(next.name, 'pomodoro');
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span>🍅</span> Pomodoro 25+5
                  </button>
                  <button
                    onClick={() => setActiveTab('today')}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                    title="View Daily Progress Rings"
                  >
                    Overview →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TODAY DASHBOARD & ACTIVITY RINGS */}
        {activeTab === 'today' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            {/* Exam Countdown Widget */}
            <ExamCountdownWidget
              activeExam={activeExam}
              allExams={state.exams || {}}
              onSwitchExam={handleSwitchExam}
              onUpdateExamDate={handleUpdateExamDate}
              overallRemainingPages={overall.remaining}
              overallTotalPages={overall.total}
              overallCoveredPages={overall.covered}
              overallPercent={overall.pct}
              streakCount={streakInfo.n}
            />

            {/* Concentric Rings & Daily Goal Journal Card */}
            <div className="journal-card rounded-3xl p-5 sm:p-7 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="flex flex-col gap-2 text-center md:text-left max-w-sm">
                <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6E6256] dark:text-[#ACA195]">
                    Today's Study Journal
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E8EFE8] dark:bg-[#233325] text-[#335336] dark:text-[#A3CCA6]">
                    {activeExam.name}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6] tracking-tight">
                  {targetInfo?.done ? 'Daily Target Hit! 🎯' : 'Keep Your Habit Active'}
                </h2>
                <p className="text-xs sm:text-sm text-[#6E6256] dark:text-[#ACA195] leading-relaxed">
                  {targetInfo && !targetInfo.past && !targetInfo.finished
                    ? `${targetInfo.pagesToday} of ${targetInfo.target} pages read today. ${targetInfo.days === 0 ? 'Test is today!' : `${targetInfo.days} days until exam.`}`
                    : `Study at least 1 page or complete 1 focus timer to keep your daily streak alive!`}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-medium justify-center md:justify-start">
                  <div className="flex items-center gap-1.5 text-[#2B2118] dark:text-[#F4EFE6]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C15C3D]" />
                    <span>Target: {targetInfo ? `${targetInfo.pagesToday}/${targetInfo.target}` : 'Set Date'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#2B2118] dark:text-[#F4EFE6]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4F6F52]" />
                    <span>Overall: {overall.pct}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#2B2118] dark:text-[#F4EFE6]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4A373]" />
                    <span>XP: {xpCur}/{xpSpan}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 p-2">
                <ActivityRings
                  todayCurrent={targetInfo?.pagesToday || 0}
                  todayTarget={targetInfo?.target || 10}
                  overallCurrent={overall.covered}
                  overallTotal={overall.total}
                  xpCurrent={xpCur}
                  xpSpan={xpSpan}
                  level={currentLevel}
                  size={144}
                />
              </div>
            </div>

            {/* Next Recommended Subject Journal Card */}
            {smartList.length > 0 ? (
              (() => {
                const s = smartList[pickIdx % smartList.length];
                const r = rangeFor(s);
                const st = studiedCount(s);
                const pct = Math.round((st / countFor(r)) * 100);
                const base = lastEffective(s);
                const a = base + 1;
                const b = Math.min(r[1], base + 5);
                const goal = a === b ? `page ${a}` : `pages ${a} to ${b}`;

                return (
                  <div className="journal-card rounded-3xl p-6 sm:p-7 flex flex-col gap-5 border-t-2 border-t-[#C15C3D] relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-2xl bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E]">
                          {s.emoji}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6]">
                              {s.name}
                            </h3>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8EFE8] dark:bg-[#233325] text-[#335336] dark:text-[#A3CCA6]">
                              {pct}% Covered
                            </span>
                          </div>
                          <p className="text-xs text-[#6E6256] dark:text-[#ACA195] mt-0.5">
                            Pages {r[0]}–{r[1]} · {countFor(r) - st} pages remaining
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setPickIdx(p => p + 1)}
                        className="text-xs text-[#6E6256] hover:text-[#2B2118] dark:hover:text-[#F4EFE6] font-semibold flex items-center gap-1 p-1.5 cursor-pointer"
                        title="Pick another subject"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Swap
                      </button>
                    </div>

                    <p className="text-sm font-medium text-[#2B2118] dark:text-[#F4EFE6]">
                      Read <strong className="text-[#C15C3D] dark:text-[#E07A5F]">{goal}</strong>, then Bean knits warm socks and waters your crops!
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <button
                        onClick={() => startTimer(s.name, 'sprint')}
                        className="h-12 rounded-2xl bg-[#C15C3D] hover:bg-[#A94B2E] active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <Clock className="w-4 h-4" /> 10-Min Sprint
                      </button>

                      <button
                        onClick={() => startTimer(s.name, 'pomodoro')}
                        className="h-12 rounded-2xl bg-[#2B2118] hover:bg-[#3D3024] dark:bg-[#F4EFE6] dark:hover:bg-[#FFFFFF] active:scale-[0.98] text-[#F4EFE6] dark:text-[#2B2118] font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <span>🍅</span> Pomodoro 25+5
                      </button>

                      <button
                        onClick={() => {
                          const hs = byName(state.hardest);
                          if (hs && !isFinished(hs)) {
                            startTimer(hs.name, 'hardest');
                          } else {
                            startTimer(s.name, 'sprint');
                          }
                        }}
                        className="h-12 rounded-2xl bg-[#F4EFE6] hover:bg-[#EAE4D9] dark:bg-[#2A2521] dark:hover:bg-[#342F2A] active:scale-[0.98] text-[#2B2118] dark:text-[#F4EFE6] border border-[#E6DFD5] dark:border-[#3D352E] font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <span>🧗</span> Hardest First
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="journal-card rounded-3xl p-8 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">🎓</span>
                <h3 className="text-xl font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6]">
                  All Quarter Pages Covered!
                </h3>
                <p className="text-sm text-[#6E6256] dark:text-[#ACA195] max-w-md">
                  Magnificent achievement! Head over to the Quiz Hub to test your memory directly against your textbook.
                </p>
              </div>
            )}

            {/* Weekly Activity 7-Day Chart */}
            <div className="journal-card rounded-3xl p-6 sm:p-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6]">
                    This Week’s Study Activity
                  </h3>
                  <p className="text-xs text-[#6E6256] dark:text-[#ACA195]">
                    Pages studied each day
                  </p>
                </div>
                <span className="text-xs font-bold text-[#4F6F52] dark:text-[#A3CCA6]">
                  {weeklyDays.reduce((acc, d) => acc + d.pages, 0)} total pages
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 pt-4 items-end h-36">
                {weeklyDays.map((d, idx) => {
                  const barHeight = maxWeeklyPage > 0 ? (d.pages / maxWeeklyPage) * 100 : 0;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-bold text-[#ACA195] opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.pages}
                      </span>
                      <div className="w-full max-w-[36px] bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E] h-28 rounded-xl flex items-end overflow-hidden p-1">
                        <div
                          className={`w-full rounded-lg transition-all duration-500 ${
                            d.isToday
                              ? 'bg-[#C15C3D]'
                              : d.pages > 0
                              ? 'bg-[#4F6F52]'
                              : 'bg-transparent'
                          }`}
                          style={{ height: `${Math.max(d.pages > 0 ? 12 : 0, barHeight)}%` }}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-bold ${
                          d.isToday ? 'text-[#C15C3D] dark:text-[#E07A5F] font-extrabold' : 'text-[#6E6256] dark:text-[#ACA195]'
                        }`}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SUBJECTS & TEXTBOOK PDF CALIBRATION */}
        {activeTab === 'subjects' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6] flex items-center gap-2">
                  <span>{state.grade || 'Grade 10'} Study Journal</span>
                  <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-[#E8EFE8] dark:bg-[#233325] text-[#335336] dark:text-[#A3CCA6]">
                    {currentExam?.name || `${ord(currentQuarter)} Quarter`}
                  </span>
                </h2>
                <p className="text-xs text-[#6E6256] dark:text-[#ACA195]">
                  Track pages, customize syllabus portions, and practice authentic textbook questions
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setSelectedSubjectToEdit(null);
                    setSubjectModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#C15C3D] hover:bg-[#A94B2E] active:scale-95 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Add a new subject to active examination"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Subject</span>
                </button>

                <label className="flex items-center gap-2 text-xs font-medium text-[#6E6256] dark:text-[#ACA195] cursor-pointer pl-1">
                  <input
                    type="checkbox"
                    checked={state.hideDone}
                    onChange={e => setState(prev => ({ ...prev, hideDone: e.target.checked }))}
                    className="rounded text-[#C15C3D] focus:ring-0 cursor-pointer"
                  />
                  <span>Hide Done</span>
                </label>
              </div>
            </div>

            {/* THREE EXAMINATION TYPES: FQT, Test 2, FE (Selectable Cards) */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <span className="text-[11px] font-semibold text-[#6E6256] dark:text-[#ACA195] uppercase tracking-wider">
                  Select Examination Type:
                </span>
                <span className="text-[11px] font-medium text-[#4F6F52] dark:text-[#A3CCA6]">
                  Strict Data Separation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['fqt', 'test2', 'fe'] as const).map(id => {
                  const ex = state.exams?.[id];
                  if (!ex) return null;
                  const isActive = ex.id === activeExam.id;
                  const exTotalPages = (ex.subjects || []).reduce((acc, s) => acc + countFor(rangeFor(s)), 0);
                  const exCoveredPages = (ex.subjects || []).reduce((acc, s) => {
                    const r = rangeFor(s);
                    const c = ex.credited?.[s.name];
                    return acc + (typeof c === 'number' ? Math.max(0, Math.min(countFor(r), c)) : 0);
                  }, 0);
                  const exPct = exTotalPages > 0 ? Math.round((exCoveredPages / exTotalPages) * 100) : 0;

                  return (
                    <div
                      key={ex.id}
                      onClick={() => handleSwitchExam(ex.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isActive
                          ? 'bg-[#FBF8F2] dark:bg-[#2A231F] border-[#C15C3D] shadow-sm ring-1 ring-[#C15C3D]/30'
                          : 'bg-white dark:bg-[#24201D] border-[#EAE4D9] dark:border-[#38312B] hover:border-[#D4A373]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6]">
                            {ex.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-[#C15C3D] text-white'
                                : 'bg-[#F4EFE6] dark:bg-[#2A2521] text-[#6E6256] dark:text-[#ACA195]'
                            }`}
                          >
                            {ex.shortName}
                          </span>
                        </div>
                        <div className="text-xs text-[#6E6256] dark:text-[#ACA195] mt-1 flex items-center justify-between">
                          <span>{ex.subjects?.length || 0} subjects</span>
                          <span>{exTotalPages} total pages</span>
                        </div>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#6E6256] dark:text-[#ACA195]">Progress</span>
                          <span className="font-bold text-[#2B2118] dark:text-[#F4EFE6]">{exPct}%</span>
                        </div>
                        <div className="w-full bg-[#EAE4D9] dark:bg-[#38312B] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isActive ? 'bg-[#C15C3D]' : 'bg-[#4F6F52]'
                            }`}
                            style={{ width: `${exPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#EAE4D9] dark:border-[#38312B] flex items-center justify-between text-[11px]">
                        <span className="text-[#6E6256] dark:text-[#ACA195]">
                          Date: <strong className="text-[#2B2118] dark:text-[#F4EFE6]">{ex.date || 'TBD'}</strong>
                        </span>
                        <span className={`font-semibold ${isActive ? 'text-[#C15C3D] dark:text-[#E07A5F]' : 'text-[#ACA195]'}`}>
                          {isActive ? '● Selected' : 'Choose →'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STUDY PLANNER FOR SELECTED EXAMINATION */}
            <div className="journal-card rounded-2xl p-4 sm:p-5 flex flex-col gap-3 border border-[#EAE4D9] dark:border-[#38312B]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6] uppercase tracking-wider">
                      {activeExam.name} Study Planner
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8EFE8] dark:bg-[#233325] text-[#335336] dark:text-[#A3CCA6]">
                      Isolated Portion
                    </span>
                  </div>
                  <p className="text-xs text-[#6E6256] dark:text-[#ACA195] mt-0.5">
                    Subjects and page ranges below belong exclusively to {activeExam.shortName}.
                  </p>
                </div>

                {/* Target Exam Date Selector */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-semibold text-[#6E6256] dark:text-[#ACA195]">Target Date:</span>
                  <input
                    type="date"
                    value={activeExam.date || ''}
                    onChange={e => handleUpdateExamDate(activeExam.id, e.target.value)}
                    className="h-8 px-2.5 rounded-xl bg-white dark:bg-[#24201D] border border-[#EAE4D9] dark:border-[#38312B] text-xs font-bold text-[#2B2118] dark:text-[#F4EFE6] cursor-pointer focus:ring-1 focus:ring-[#C15C3D]"
                    title="Change target examination date"
                  />
                </div>
              </div>

              {/* Study Planning Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E]">
                  <span className="text-[10px] uppercase font-semibold text-[#6E6256] dark:text-[#ACA195] block">Days Remaining</span>
                  <span className="text-sm font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6]">
                    {targetInfo?.days !== undefined
                      ? (targetInfo.days < 0 ? 'Passed' : targetInfo.days === 0 ? 'Exam Today! 🎯' : `${targetInfo.days} days`)
                      : 'Set Date'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E]">
                  <span className="text-[10px] uppercase font-semibold text-[#6E6256] dark:text-[#ACA195] block">Total Workload</span>
                  <span className="text-sm font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6]">
                    {overall.total} pages ({currentSubjects.length} subjs)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E]">
                  <span className="text-[10px] uppercase font-semibold text-[#6E6256] dark:text-[#ACA195] block">Pages Remaining</span>
                  <span className="text-sm font-serif font-bold text-[#C15C3D] dark:text-[#E07A5F]">
                    {overall.remaining} pages left
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#E8EFE8] dark:bg-[#233325] border border-[#D5E2D4] dark:border-[#2F4732]">
                  <span className="text-[10px] uppercase font-semibold text-[#335336] dark:text-[#A3CCA6] block">Daily Study Pace</span>
                  <span className="text-sm font-serif font-bold text-[#335336] dark:text-[#A3CCA6]">
                    {Math.ceil(overall.remaining / Math.max(1, targetInfo?.days || 1))} pages / day
                  </span>
                </div>
              </div>

              {/* Overall Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#6E6256] dark:text-[#ACA195]">Overall Portion Completion</span>
                  <span className="font-bold text-[#4F6F52] dark:text-[#A3CCA6]">
                    {overall.covered} of {overall.total} pages ({overall.pct}%)
                  </span>
                </div>
                <div className="w-full bg-[#EAE4D9] dark:bg-[#38312B] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4F6F52] rounded-full transition-all duration-300"
                    style={{ width: `${overall.pct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* SUBJECTS LIST & DETAILED PROGRESS (Item 4: All 6 required metrics) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-0.5 pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {currentSubjects.length} Subjects in {activeExam.name}:
                </span>
                <button
                  onClick={() => {
                    setSelectedSubjectToEdit(null);
                    setSubjectModalOpen(true);
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>

              {currentSubjects.length === 0 ? (
                <div className="glass-card rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-2xl">
                    📚
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    No subjects in {activeExam.name} yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    Tap the button below to type your subject name and enter the page range you need to study.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedSubjectToEdit(null);
                      setSubjectModalOpen(true);
                    }}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Subject</span>
                  </button>
                </div>
              ) : (
                currentSubjects
                  .filter(s => (state.hideDone ? !isFinished(s) : true))
                  .map(s => {
                    const r = rangeFor(s);
                    const st = studiedCount(s);
                    const total = countFor(r);
                    const remaining = Math.max(0, total - st);
                    const pct = Math.round((st / total) * 100);
                    const finished = isFinished(s);
                    const hasBook = !!booksMeta[s.name];

                    return (
                      <div
                        key={s.name}
                        className="journal-card rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 hover:border-[#D4A373] dark:hover:border-[#52443A] transition-all"
                      >
                        {/* Top: Name, Emoji, Range, Total & Status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl p-2.5 rounded-xl bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E] shrink-0">
                              {s.emoji}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6]">
                                  {s.name}
                                </h3>
                                {finished && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8EFE8] dark:bg-[#233325] text-[#335336] dark:text-[#A3CCA6] border border-[#D5E2D4] dark:border-[#2F4732]">
                                    Done ✓
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#6E6256] dark:text-[#ACA195] mt-0.5">
                                <span className="font-semibold text-[#2B2118] dark:text-[#F4EFE6]">
                                  Pages {r[0]}–{r[1]}
                                </span>
                                <span>·</span>
                                <span>{total} total pages</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-lg font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6] tabular-nums">
                              {pct}%
                            </span>
                            <span className="block text-[11px] text-[#6E6256] dark:text-[#ACA195]">
                              {remaining === 0 ? 'Completed' : `${remaining} left`}
                            </span>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-[#EAE4D9] dark:bg-[#38312B] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              finished ? 'bg-[#4F6F52]' : 'bg-[#C15C3D]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Explicit 6-metric summary pill grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-2.5 rounded-xl bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E]">
                          <div>
                            <span className="text-[#6E6256] dark:text-[#ACA195] block text-[10px] font-semibold uppercase">Assigned Range</span>
                            <span className="font-bold text-[#2B2118] dark:text-[#F4EFE6]">pp. {r[0]}–{r[1]}</span>
                          </div>
                          <div>
                            <span className="text-[#6E6256] dark:text-[#ACA195] block text-[10px] font-semibold uppercase">Total Pages</span>
                            <span className="font-bold text-[#2B2118] dark:text-[#F4EFE6]">{total} pages</span>
                          </div>
                          <div>
                            <span className="text-[#6E6256] dark:text-[#ACA195] block text-[10px] font-semibold uppercase">Pages Completed</span>
                            <span className="font-bold text-[#4F6F52] dark:text-[#A3CCA6]">{st} / {total}</span>
                          </div>
                          <div>
                            <span className="text-[#6E6256] dark:text-[#ACA195] block text-[10px] font-semibold uppercase">Pages Remaining</span>
                            <span className="font-bold text-[#C15C3D] dark:text-[#E07A5F]">{remaining} pages</span>
                          </div>
                        </div>

                        {/* Actions & Easy Progress Update Controls */}
                        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                          {/* Left: Quick update controls */}
                          <div className="flex items-center gap-1.5">
                            {!finished ? (
                              <>
                                <button
                                  onClick={() => quickAdd(s.name, 1)}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE4D9] dark:bg-[#2A2521] dark:hover:bg-[#342F2A] border border-[#E6DFD5] dark:border-[#3D352E] text-xs font-bold text-[#2B2118] dark:text-[#F4EFE6] cursor-pointer"
                                  title="Add 1 studied page"
                                >
                                  +1
                                </button>
                                <button
                                  onClick={() => quickAdd(s.name, 5)}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE4D9] dark:bg-[#2A2521] dark:hover:bg-[#342F2A] border border-[#E6DFD5] dark:border-[#3D352E] text-xs font-bold text-[#2B2118] dark:text-[#F4EFE6] cursor-pointer"
                                  title="Add 5 studied pages"
                                >
                                  +5
                                </button>
                                <button
                                  onClick={() => quickAdd(s.name, 10)}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE4D9] dark:bg-[#2A2521] dark:hover:bg-[#342F2A] border border-[#E6DFD5] dark:border-[#3D352E] text-xs font-bold text-[#2B2118] dark:text-[#F4EFE6] cursor-pointer"
                                  title="Add 10 studied pages"
                                >
                                  +10
                                </button>
                              </>
                            ) : null}

                            {st > 0 && (
                              <button
                                onClick={() => {
                                  const current = lastEffective(s);
                                  setLastPage(s.name, Math.max(r[0] - 1, current - 1));
                                }}
                                className="px-2 py-1.5 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE4D9] dark:bg-[#2A2521] dark:hover:bg-[#342F2A] border border-[#E6DFD5] dark:border-[#3D352E] text-xs font-bold text-[#6E6256] dark:text-[#ACA195] cursor-pointer"
                                title="Undo 1 page"
                              >
                                -1
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setManualSubjectModal(s.name);
                                setManualPageInput(String(lastEffective(s)));
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE4D9] dark:bg-[#2A2521] dark:hover:bg-[#342F2A] border border-[#E6DFD5] dark:border-[#3D352E] text-xs font-semibold text-[#2B2118] dark:text-[#F4EFE6] cursor-pointer"
                              title="Update current page number"
                            >
                              Update Page
                            </button>
                          </div>

                          {/* Right: Subject Management Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedSubjectToEdit(s);
                                setSubjectModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE4D9] dark:bg-[#2A2521] dark:hover:bg-[#342F2A] border border-[#E6DFD5] dark:border-[#3D352E] text-xs font-semibold text-[#2B2118] dark:text-[#F4EFE6] flex items-center gap-1 transition-all cursor-pointer"
                              title="Edit subject name or page range"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#6E6256]" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Delete ${s.name} from ${activeExam.shortName}?`)) {
                                  handleDeleteSubject(s.name);
                                }
                              }}
                              className="p-1.5 rounded-xl text-[#ACA195] hover:text-[#C15C3D] hover:bg-[#F9EBE6] dark:hover:bg-[#341F18] transition-all cursor-pointer"
                              title={`Delete ${s.name} from ${activeExam.shortName}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setBookModalSubject(s.name);
                                setBookStatusMsg('');
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${
                                hasBook
                                  ? 'bg-[#E8EFE8] dark:bg-[#233325] text-[#335336] dark:text-[#A3CCA6] border-[#D5E2D4] dark:border-[#2F4732]'
                                  : 'bg-[#F4EFE6] hover:bg-[#EAE4D9] dark:bg-[#2A2521] dark:hover:bg-[#342F2A] border-[#E6DFD5] dark:border-[#3D352E] text-[#6E6256] dark:text-[#ACA195]'
                              }`}
                              title="Manage textbook PDF for genuine practice questions"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Book{hasBook ? ' ✓' : ''}</span>
                            </button>

                            <button
                              onClick={() => launchTextbookQuiz(s.name)}
                              className="px-3 py-1.5 rounded-xl bg-[#2B2118] hover:bg-[#3D3024] dark:bg-[#F4EFE6] dark:hover:bg-[#FFFFFF] text-[#F4EFE6] dark:text-[#2B2118] text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                              title="Practice textbook questions"
                            >
                              <span>Quiz Me</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AUTHENTIC TEXTBOOK EXAMINATION PRACTICE HUB */}
        {activeTab === 'quiz' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="glass-card rounded-3xl p-6 sm:p-7 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Textbook Question Practice System
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Authentic Textbook Examination Practice
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                100% authentic questions extracted directly from your uploaded {state.grade || 'Grade 10'} textbooks. No AI-generated or invented questions. Original options, numbers, and exact page references preserved.
              </p>

              {/* Practice Configuration Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Subject</label>
                  <select
                    value={quizHubSubject}
                    onChange={e => setQuizHubSubject(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-xs"
                  >
                    {currentSubjects.map(s => (
                      <option key={s.name} value={s.name}>
                        {s.emoji} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Question Format</label>
                  <select
                    value={quizHubTypeFilter}
                    onChange={e => setQuizHubTypeFilter(e.target.value as any)}
                    className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-xs"
                  >
                    <option value="all">All Formats</option>
                    <option value="multiple_choice">Multiple Choice (A, B, C, D)</option>
                    <option value="true_false">True / False</option>
                    <option value="fill_in_blank">Fill in the Blank</option>
                    <option value="calculation">Calculations & Problems</option>
                    <option value="short_answer">Short Answer / Review</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => launchTextbookQuiz(quizHubSubject, 1, 999, quizHubTypeFilter)}
                    className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4" /> Start Practice Round
                  </button>
                </div>
              </div>
            </div>

            {/* Subject Textbook Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentSubjects.map(s => {
                const r = rangeFor(s);
                const hasBook = !!booksMeta[s.name];
                return (
                  <div key={s.name} className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                        {s.emoji}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</h4>
                        <span className="text-xs text-slate-500">Exam Pages {r[0]}–{r[1]}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => launchTextbookQuiz(s.name, r[0], r[1])}
                        className={`w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          hasBook
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {hasBook ? 'Practice Textbook Questions' : 'Upload Textbook PDF'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS & FIREBASE CLOUD SYNC */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="glass-card rounded-3xl p-6 sm:p-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Cloud Account & Multiplayer Sync
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sync your island, farm, and study stats across devices with Google Firebase.
                  </p>
                </div>
                {currentUser && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/40">
                    Connected
                  </span>
                )}
              </div>

              {currentUser ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {currentUser.displayName || 'Scholar'}
                      </h4>
                      <p className="text-xs text-slate-500">{currentUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => logoutUser()}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E] gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#2B2118] dark:text-[#F4EFE6]">
                      You are in Offline Guest Mode
                    </h4>
                    <p className="text-xs text-[#6E6256] dark:text-[#ACA195]">
                      Sign in to back up your sky island, visit friends, and sync progress automatically.
                    </p>
                  </div>
                  <button
                    onClick={() => loginWithGoogle()}
                    className="px-5 py-2.5 rounded-xl bg-[#2B2118] hover:bg-[#3D3024] dark:bg-[#F4EFE6] dark:hover:bg-[#FFFFFF] text-[#F4EFE6] dark:text-[#2B2118] text-xs font-bold whitespace-nowrap cursor-pointer transition-all shadow-xs"
                  >
                    Sign in with Google
                  </button>
                </div>
              )}
            </div>

            {/* Academic Grade & Examination Management */}
            <div className="journal-card rounded-3xl p-6 sm:p-7 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-serif font-bold text-[#2B2118] dark:text-[#F4EFE6] flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#C15C3D]" />
                    <span>Academic Grade & Exam Management</span>
                  </h3>
                  <p className="text-xs text-[#6E6256] dark:text-[#ACA195]">
                    Currently configured for <strong className="text-[#2B2118] dark:text-[#F4EFE6]">{state.grade || 'Grade 10'}</strong> · <strong className="text-[#2B2118] dark:text-[#F4EFE6]">{currentExam?.name || `${ord(currentQuarter)} Quarter`}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedSubjectToEdit(null);
                      setSubjectModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#C15C3D] hover:bg-[#A94B2E] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>
              </div>

              {/* Active Exam Summary Card with Grade Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#F4EFE6] dark:bg-[#2A2521] border border-[#E6DFD5] dark:border-[#3D352E] text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-[#6E6256] dark:text-[#ACA195] uppercase tracking-wider block mb-1">Student Grade</span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={state.grade || 'Grade 10'}
                      onChange={(e) => handleSelectGrade(e.target.value)}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#24201D] border border-[#EAE4D9] dark:border-[#38312B] text-xs font-bold text-[#2B2118] dark:text-[#F4EFE6] cursor-pointer focus:outline-hidden"
                      title="Select grade level to reset syllabus"
                    >
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11 (Natural Science)">Grade 11 (Natural Science)</option>
                      <option value="Grade 11 (Social Science)">Grade 11 (Social Science)</option>
                      <option value="Grade 12 (Natural Science)">Grade 12 (Natural Science)</option>
                      <option value="Grade 12 (Social Science)">Grade 12 (Social Science)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Exam Period</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{currentExam?.name || `${ord(currentQuarter)} Quarter`}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Workload</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{currentSubjects.length} subjects · {overall.total} pages</span>
                </div>
              </div>

              {/* Separate Examination Profiles (Strictly FQT, Test 2, FE) */}
              <div className="flex flex-col gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Switch Examination Profile (Strictly 3 Exams):
                  </label>
                  <button
                    onClick={() => {
                      setSelectedSubjectToEdit(null);
                      setSubjectModalOpen(true);
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Subject
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(['fqt', 'test2', 'fe'] as const).map(id => {
                    const ex = state.exams?.[id];
                    if (!ex) return null;
                    const isActive = ex.id === activeExam.id;
                    return (
                      <div
                        key={ex.id}
                        onClick={() => handleSwitchExam(ex.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                          isActive
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-white/10 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {ex.name}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block pt-0.5">
                            {ex.subjects?.length || 0} subjects · Target: {ex.date || 'TBD'}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwitchExam(ex.id);
                          }}
                          className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {isActive ? 'Active' : 'Select'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Target Exam Date for {activeExam.name}:</span>
                  <span className="text-[11px] text-slate-500">Updates only this examination</span>
                </label>
                <input
                  type="date"
                  value={activeExam.date || state.date}
                  onChange={e => {
                    const newDate = e.target.value;
                    setState(prev => {
                      const curEx = prev.exams?.[prev.activeExamId];
                      return {
                        ...prev,
                        date: newDate,
                        exams: curEx
                          ? {
                              ...prev.exams,
                              [prev.activeExamId]: {
                                ...curEx,
                                date: newDate
                              }
                            }
                          : prev.exams
                      };
                    });
                  }}
                  className="h-11 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>
            </div>

            {/* Install as Native Android / iOS PWA */}
            <PWAInstallButton variant="full" />

            {/* Cross-Device Synchronization Guide */}
            <div className="glass-card rounded-3xl p-6 flex flex-col gap-3 border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                  🔄
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    How Multi-Device Cloud Sync Works
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Open your account on an Android phone, iPad, laptop, or desktop computer seamlessly.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-1">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">1</span>
                    Sign in with Google
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Connect your Google account in the top right or above. Your Bean, farm, level, and stats are saved in Firestore.
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-1">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">2</span>
                    Open on Other Device
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Visit the deployed web URL or install the PWA on your phone, tablet, or secondary laptop.
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-1">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">3</span>
                    Sign in Same Account
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Log in with the same email. All your islands, crops, friend lists, and textbook questions load automatically!
                  </span>
                </div>
              </div>
            </div>

            {/* Standalone HTML Export */}
            <div className="glass-card rounded-3xl p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center text-xl">
                  📥
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Standalone Offline HTML Application
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Delivered directly from browser memory via client-side Blob. 100% offline with zero cookie-check redirects.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={downloadProjectZip}
                  className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Download className="w-4 h-4" /> Download Complete Project ZIP
                </button>
                <button
                  onClick={downloadStandaloneHtml}
                  className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <Download className="w-4 h-4" /> Download StudyQuest-Grade10.html
                </button>
              </div>
            </div>

            {/* Backup & Reset */}
            <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Data Backup & Reset
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your progress is stored safely in your browser and cloud.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify({ ...state, timer: null }, null, 2)], {
                      type: 'application/json'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `grade10-studyquest-backup-${todayKey()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('Backup JSON exported!');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  Export Progress Backup
                </button>

                <button
                  onClick={() => {
                    if (confirm('Reset all progress, XP, and streaks? Book PDFs will be kept.')) {
                      setState(prev => ({
                        ...defaultState(),
                        offsets: prev.offsets,
                        quarter: prev.quarter
                      }));
                      showToast('Progress reset.');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-xs font-bold text-rose-600 dark:text-rose-400"
                >
                  Reset Everything
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile-First Handcrafted Journal Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 journal-panel px-2 py-2 flex items-center justify-around max-w-lg mx-auto sm:rounded-t-3xl shadow-lg border-t border-[#EAE4D9] dark:border-[#38312B]">
        <button
          onClick={() => {
            setVisitingFriend(null);
            setActiveTab('island');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'island'
              ? 'text-[#C15C3D] dark:text-[#E07A5F] font-bold'
              : 'text-[#6E6256] dark:text-[#ACA195]'
          }`}
        >
          <span className="text-xl leading-none">🏝️</span>
          <span className="text-[10px] font-medium">Island</span>
        </button>

        <button
          onClick={() => setActiveTab('today')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'today'
              ? 'text-[#C15C3D] dark:text-[#E07A5F] font-bold'
              : 'text-[#6E6256] dark:text-[#ACA195]'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-medium">Today</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'subjects'
              ? 'text-[#C15C3D] dark:text-[#E07A5F] font-bold'
              : 'text-[#6E6256] dark:text-[#ACA195]'
          }`}
        >
          <ListOrdered className="w-5 h-5" />
          <span className="text-[10px] font-medium">Subjects</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'quiz'
              ? 'text-[#C15C3D] dark:text-[#E07A5F] font-bold'
              : 'text-[#6E6256] dark:text-[#ACA195]'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium">Quizzes</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'text-[#C15C3D] dark:text-[#E07A5F] font-bold'
              : 'text-[#6E6256] dark:text-[#ACA195]'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Setup</span>
        </button>
      </nav>

      {/* Focus Timer Sheet Modal */}
      {state.timer && (
        <FocusSheet
          timer={state.timer}
          subject={getSubjectByName(state.timer.subject) || currentSubjects[0]}
          quarter={currentQuarter}
          lastStudied={lastEffective(getSubjectByName(state.timer.subject) || currentSubjects[0])}
          totalSocks={state.socks}
          onPauseToggle={() => {
            const t = state.timer;
            if (!t) return;
            if (t.stage === 'running') {
              setState(prev =>
                prev.timer
                  ? {
                      ...prev,
                      timer: {
                        ...prev.timer,
                        stage: 'paused',
                        left: Math.max(0, (prev.timer.endsAt || 0) - Date.now()),
                        endsAt: null
                      }
                    }
                  : prev
              );
            } else if (t.stage === 'paused') {
              setState(prev =>
                prev.timer
                  ? {
                      ...prev,
                      timer: {
                        ...prev.timer,
                        stage: 'running',
                        endsAt: Date.now() + (prev.timer.left || 0),
                        left: null
                      }
                    }
                  : prev
              );
            }
          }}
          onCancel={() => {
            if (confirm('Cancel this focus round? Bean will understand.')) {
              setState(prev => ({ ...prev, timer: null }));
            }
          }}
          onFinishEarly={() => {
            handleTimerFinishWork(false);
          }}
          onLogPages={pages => {
            if (state.timer) {
              quickAdd(state.timer.subject, pages);
            }
          }}
          onSaveExactPage={page => {
            if (state.timer) {
              setLastPage(state.timer.subject, page);
            }
          }}
          onNextRound={() => {
            if (state.timer) {
              startTimer(state.timer.subject, state.timer.mode, state.timer.round + 1);
            }
          }}
          onStartBreak={() => {
            if (state.timer) {
              const ms = 5 * 60000;
              setState(prev =>
                prev.timer
                  ? {
                      ...prev,
                      timer: {
                        ...prev.timer,
                        phase: 'break',
                        stage: 'running',
                        total: ms,
                        endsAt: Date.now() + ms,
                        left: null
                      }
                    }
                  : prev
              );
            }
          }}
          onSkipBreak={() => {
            if (state.timer) {
              startTimer(state.timer.subject, 'pomodoro', state.timer.round + 1);
            }
          }}
          onSwitchSubject={() => {
            const currentSubj = state.timer?.subject;
            const other = currentSubjects.find(s => s.name !== currentSubj && !isFinished(s)) || currentSubjects[0];
            startTimer(other.name, 'sprint');
          }}
          onClose={() => setState(prev => ({ ...prev, timer: null }))}
          onStartQuiz={() => {
            const subj = state.timer?.subject;
            setState(prev => ({ ...prev, timer: null }));
            if (subj) launchTextbookQuiz(subj);
          }}
        />
      )}

      {/* World Sky Map (Celestial Constellation View) */}
      {showSkyMap && (
        <WorldSkyMap
          currentUserId={currentUser?.uid || 'local-me'}
          currentUserName={currentUser?.displayName || 'Scholar Explorer'}
          friendsIslands={skyFriendsList}
          onSelectIsland={islandId => {
            handleVisitFriend(islandId);
          }}
          onClose={() => setShowSkyMap(false)}
        />
      )}

      {/* Friends Drawer */}
      {showFriendsDrawer && (
        <FriendsDrawer
          friendCode={friendCode}
          friends={friendsList}
          onAddFriend={handleAddFriend}
          onVisitFriend={friendUid => {
            handleVisitFriend(friendUid);
          }}
          onClose={() => setShowFriendsDrawer(false)}
        />
      )}

      {/* Bean Wardrobe Modal */}
      {showWardrobe && (
        <BeanWardrobeModal
          currentOutfit={island.beanOutfit}
          onSaveOutfit={newOutfit => {
            setIsland(prev => ({ ...prev, beanOutfit: newOutfit }));
            showToast('👗 Bean looks wonderful in their new outfit!');
          }}
          onClose={() => setShowWardrobe(false)}
        />
      )}

      {/* Farm Shop Modal */}
      {showFarmShop && (
        <FarmShopModal
          socks={state.socks}
          houseLevel={island.houseLevel}
          decor={island.decor}
          onBuySeeds={(cropType, cost) => {
            if (state.socks < cost) {
              showToast('Not enough socks! Complete focus rounds to knit socks 🧦');
              return;
            }
            setState(prev => ({ ...prev, socks: prev.socks - cost }));
            setCrops(prevCrops => {
              const emptyIdx = prevCrops.findIndex(c => c.stage === 0 || c.stage === 3);
              const idxToUse = emptyIdx !== -1 ? emptyIdx : 0;
              return prevCrops.map((c, i) =>
                i === idxToUse ? { ...c, cropType, stage: 0, waterMinutes: 0 } : c
              );
            });
            showToast(`🌱 Planted new ${cropType} seeds! Study to water them.`);
          }}
          onUpgradeHouse={(newLevel, cost) => {
            if (state.socks < cost) {
              showToast('Not enough socks to expand the cabin! 🧦');
              return;
            }
            setState(prev => ({ ...prev, socks: prev.socks - cost }));
            setIsland(prev => ({ ...prev, houseLevel: newLevel }));
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
            showToast(`🏡 Cabin upgraded to Level ${newLevel}!`);
          }}
          onBuyDecor={(id, cost, name) => {
            if (state.socks < cost) {
              showToast('Not enough socks! 🧦');
              return;
            }
            setState(prev => ({ ...prev, socks: prev.socks - cost }));
            setIsland(prev => ({ ...prev, decor: { ...prev.decor, [id]: true } }));
            showToast(`🎉 Placed ${name} on your island!`);
          }}
          onClose={() => setShowFarmShop(false)}
        />
      )}

      {/* Textbook Examination Practice Modal (Authentic Textbook Questions) */}
      {activeTextbookQuiz && (
        <TextbookQuizModal
          subject={activeTextbookQuiz.subject}
          questions={activeTextbookQuiz.questions}
          onComplete={(score, total, earnedXp) => {
            setState(prev => ({ ...prev, xp: prev.xp + earnedXp }));
            showToast(`Textbook practice completed! ${score}/${total} solved · +${earnedXp} XP`);
            setActiveTextbookQuiz(null);
          }}
          onClose={() => setActiveTextbookQuiz(null)}
        />
      )}

      {/* Manual Page Update Modal */}
      {manualSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Update {manualSubjectModal}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the last page you finished for this quarter.
            </p>
            <input
              type="number"
              value={manualPageInput}
              onChange={e => setManualPageInput(e.target.value)}
              placeholder="e.g. 85"
              className="h-11 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-sm"
            />
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  const n = Number(manualPageInput);
                  if (Number.isInteger(n) && n >= 0) {
                    setLastPage(manualSubjectModal, n);
                    setManualSubjectModal(null);
                  }
                }}
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Save
              </button>
              <button
                onClick={() => setManualSubjectModal(null)}
                className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Management & Calibration Modal */}
      {bookModalSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-card rounded-3xl p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Textbook: {bookModalSubject}
              </h3>
              <button
                onClick={() => setBookModalSubject(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Add the official PDF for {bookModalSubject}. Text is parsed and saved securely in your browser's IndexedDB. Genuine exercises will be extracted.
            </p>

            {booksMeta[bookModalSubject] && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-xs text-blue-900 dark:text-blue-300 font-medium">
                Saved: {booksMeta[bookModalSubject].name} ({booksMeta[bookModalSubject].pageCount} pages,{' '}
                {booksMeta[bookModalSubject].textPages} with text)
              </div>
            )}

            {bookStatusMsg && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{bookStatusMsg}</p>
            )}

            <label className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm">
              <Upload className="w-4 h-4" />
              {booksMeta[bookModalSubject] ? 'Replace PDF File' : 'Choose PDF Textbook'}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const ok = await importBook(bookModalSubject, file, msg => setBookStatusMsg(msg));
                  if (ok) {
                    const all = await idbAll<BookMeta>('meta');
                    const map: Record<string, BookMeta> = {};
                    all.forEach(m => {
                      if (m && m.subject) map[m.subject] = m;
                    });
                    setBooksMeta(map);
                  }
                  e.target.value = '';
                }}
              />
            </label>

            {/* Page Offset Calibration */}
            {booksMeta[bookModalSubject] && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 dark:border-white/10">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Page Calibration: Printed Page 1 = PDF Page
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const cur = state.offsets[bookModalSubject] || 1;
                      setState(prev => ({
                        ...prev,
                        offsets: { ...prev.offsets, [bookModalSubject]: Math.max(1, cur - 1) }
                      }));
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 font-bold"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={state.offsets[bookModalSubject] || 1}
                    onChange={e => {
                      const n = Number(e.target.value);
                      if (Number.isInteger(n)) {
                        setState(prev => ({
                          ...prev,
                          offsets: { ...prev.offsets, [bookModalSubject]: n }
                        }));
                      }
                    }}
                    className="flex-1 h-10 px-3 rounded-xl text-center font-bold text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    onClick={() => {
                      const cur = state.offsets[bookModalSubject] || 1;
                      setState(prev => ({
                        ...prev,
                        offsets: { ...prev.offsets, [bookModalSubject]: cur + 1 }
                      }));
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setBookModalSubject(null)}
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Manual Subject & Page Range Modal */}
      <SubjectManualEditorModal
        isOpen={subjectModalOpen}
        examName={activeExam.name}
        examShortName={activeExam.shortName}
        subjectToEdit={selectedSubjectToEdit}
        onSave={handleSaveSubject}
        onDelete={handleDeleteSubject}
        onClose={() => {
          setSubjectModalOpen(false);
          setSelectedSubjectToEdit(null);
        }}
      />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 glass-card px-4 py-2.5 rounded-full shadow-2xl border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white animate-in slide-in-from-bottom-2 duration-150">
          {toastMsg}
        </div>
      )}
    </div>
  );
}

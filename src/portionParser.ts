import { Subject, StudyPortion } from './types.ts';

export interface ParsedSubjectPortion {
  name: string;
  emoji: string;
  hue: number;
  startPage: number;
  endPage: number;
  chapters?: string[];
  rawText?: string;
}

export interface PortionParseResult {
  detectedGrade?: string;
  detectedExamName?: string;
  detectedQuarter?: number;
  detectedDate?: string;
  subjects: ParsedSubjectPortion[];
  rawLineCount: number;
  unrecognizedLines: string[];
}

// Subject Emoji & Hue Dictionary
const SUBJECT_METADATA: Record<string, { emoji: string; hue: number }> = {
  math: { emoji: '📐', hue: 225 },
  mathematics: { emoji: '📐', hue: 225 },
  physics: { emoji: '⚡', hue: 265 },
  chemistry: { emoji: '🧪', hue: 165 },
  biology: { emoji: '🧬', hue: 130 },
  science: { emoji: '🔬', hue: 150 },
  'general science': { emoji: '🔬', hue: 150 },
  'environmental science': { emoji: '🌿', hue: 140 },
  english: { emoji: '📖', hue: 300 },
  'integrated english': { emoji: '📖', hue: 300 },
  amharic: { emoji: '📝', hue: 335 },
  'afaan oromoo': { emoji: '💬', hue: 80 },
  oromiffa: { emoji: '💬', hue: 80 },
  geography: { emoji: '🌍', hue: 190 },
  history: { emoji: '🏺', hue: 10 },
  'social studies': { emoji: '🌍', hue: 195 },
  citizenship: { emoji: '🤝', hue: 22 },
  civics: { emoji: '🤝', hue: 22 },
  economics: { emoji: '📈', hue: 42 },
  'computer education': { emoji: '💻', hue: 205 },
  'computer science': { emoji: '💻', hue: 205 },
  ict: { emoji: '💻', hue: 205 },
  'information technology': { emoji: '💻', hue: 205 },
  business: { emoji: '💼', hue: 160 },
  'business education': { emoji: '💼', hue: 160 },
  art: { emoji: '🎨', hue: 280 },
  'art & craft': { emoji: '🎨', hue: 280 },
  music: { emoji: '🎵', hue: 310 },
  reading: { emoji: '📚', hue: 45 },
  french: { emoji: '🗼', hue: 215 },
  arabic: { emoji: '🕌', hue: 175 },
  'technical drawing': { emoji: '📏', hue: 35 },
  agriculture: { emoji: '🌾', hue: 110 }
};

export function lookupSubjectMetadata(name: string): { emoji: string; hue: number } {
  const norm = name.trim().toLowerCase();
  for (const [key, val] of Object.entries(SUBJECT_METADATA)) {
    if (norm === key || norm.includes(key)) {
      return val;
    }
  }
  // Fallback hashing for original subjects
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return { emoji: '📘', hue };
}

/**
 * Intelligent Portion Division Text Parser
 * Reads and organizes portion breakdown into clean subjects and page ranges.
 */
export function parsePortionDivisionText(text: string): PortionParseResult {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  let detectedGrade: string | undefined;
  let detectedExamName: string | undefined;
  let detectedQuarter: number | undefined;
  let detectedDate: string | undefined;

  const subjects: ParsedSubjectPortion[] = [];
  const unrecognizedLines: string[] = [];

  // Patterns for meta detection
  const gradeRegex = /\b(?:grade|gr\.?|class)\s*(\d{1,2})\b/i;
  const quarterRegex = /\b(?:quarter|qtr\.?|t|term)\s*([1-4])\b/i;
  const examRegex = /\b(fqt|first quarter test|second quarter test|third quarter test|fourth quarter test|midterm|final exam|finals|monthly test|unit test|mock exam|portion division|portion breakdown)\b/i;
  const dateRegex = /\b(?:202[6-9][-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]202[6-9]|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s*(?:202[6-9])?)\b/i;

  for (const line of lines) {
    // 1. Check for global meta in header lines
    if (!detectedGrade) {
      const gm = line.match(gradeRegex);
      if (gm) detectedGrade = `Grade ${gm[1]}`;
    }
    if (!detectedQuarter) {
      const qm = line.match(quarterRegex);
      if (qm) detectedQuarter = parseInt(qm[1], 10);
    }
    if (!detectedExamName) {
      const em = line.match(examRegex);
      if (em) detectedExamName = em[0].toUpperCase();
    }
    if (!detectedDate) {
      const dm = line.match(dateRegex);
      if (dm) detectedDate = dm[0];
    }

    // 2. Parse Subject and Page Range
    // Normalize dashes and keywords
    const normalized = line
      .replace(/[–—−]/g, '-')
      .replace(/\bto\b/gi, '-')
      .replace(/\btill\b/gi, '-')
      .replace(/\bthrough\b/gi, '-');

    // Regex to match subject with page range
    // e.g. "Math: pages 1 - 35", "Physics - pp. 45 - 80", "1. Chemistry: Unit 1 & 2 (1-46)", "English ... 1-28"
    // Also matches "Mathematics 1-35" or table style "Math | 1-35"
    const subjectPageRegex = /^(?:\d+[\.\)\-]\s*)?([A-Za-z\s&'/]+?)(?:\s*[:|\-–—\t]+\s*|\s+(?:pages?|pp\.?|p\.?)\s*|\s*\(|\s+)(?:(?:unit|chapter|lesson|topic)\s*[\d\w,\s&]+[:|\-–—\s]*)?(?:pages?|pp\.?|p\.?)?\s*(\d{1,4})\s*-\s*(\d{1,4})(?:\s*\))?/i;

    const match = normalized.match(subjectPageRegex);

    if (match) {
      let subjName = match[1].trim();
      // Remove trailing words like "pages", "page", "unit", "chapter"
      subjName = subjName.replace(/\b(pages?|pp\.?|p\.?|portion|test|exam)\b/gi, '').trim();
      // Remove leading bullets or symbols
      subjName = subjName.replace(/^[•▪●◦■□–\-\d\.]+\s*/, '').trim();

      const start = parseInt(match[2], 10);
      const end = parseInt(match[3], 10);

      if (subjName.length >= 2 && !isNaN(start) && !isNaN(end) && end >= start) {
        // Extract chapters if present
        const chapMatch = line.match(/\b(unit|chapter|lesson|topic)\s*(\d+(?:\s*(?:and|&|,|-)\s*\d+)?|[a-z0-9\s]+)(?=[,\(:\-]|$)/i);
        const chapters: string[] = [];
        if (chapMatch) {
          chapters.push(chapMatch[0].trim());
        }

        const meta = lookupSubjectMetadata(subjName);
        subjects.push({
          name: cleanSubjectName(subjName),
          emoji: meta.emoji,
          hue: meta.hue,
          startPage: start,
          endPage: end,
          chapters: chapters.length > 0 ? chapters : undefined,
          rawText: line
        });
        continue;
      }
    }

    // Secondary fallback regex for reverse format: "Pages 1-35 for Mathematics"
    const reverseRegex = /(?:pages?|pp\.?|p\.?)\s*(\d{1,4})\s*-\s*(\d{1,4})\s*(?:for|of|in|:|-)\s*([A-Za-z\s&'/]+)/i;
    const revMatch = normalized.match(reverseRegex);
    if (revMatch) {
      const start = parseInt(revMatch[1], 10);
      const end = parseInt(revMatch[2], 10);
      const subjName = cleanSubjectName(revMatch[3].trim());
      if (subjName.length >= 2 && end >= start) {
        const meta = lookupSubjectMetadata(subjName);
        subjects.push({
          name: subjName,
          emoji: meta.emoji,
          hue: meta.hue,
          startPage: start,
          endPage: end,
          rawText: line
        });
        continue;
      }
    }

    // If line looks like a header or skip word, don't mark as unrecognized
    if (
      /^(?:portion|syllabus|division|breakdown|exam|test|date|schedule|semester|academic|student|name|school|grade)/i.test(
        line
      )
    ) {
      continue;
    }

    if (line.length > 3) {
      unrecognizedLines.push(line);
    }
  }

  // Deduplicate subjects by name (keeping the one with latest or wider range)
  const uniqueSubjects: ParsedSubjectPortion[] = [];
  const seen = new Set<string>();
  for (const s of subjects) {
    const key = s.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSubjects.push(s);
    }
  }

  return {
    detectedGrade,
    detectedExamName,
    detectedQuarter,
    detectedDate,
    subjects: uniqueSubjects,
    rawLineCount: lines.length,
    unrecognizedLines
  };
}

function cleanSubjectName(raw: string): string {
  // Title case the subject name nicely
  const cleaned = raw.replace(/[^\w\s&'-]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Converts parsed portions into first-class Study Quest subjects
 */
export function convertParsedToSubjects(parsed: ParsedSubjectPortion[]): Subject[] {
  return parsed.map(p => {
    const portions: StudyPortion[] = [
      {
        id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: p.chapters ? p.chapters.join(', ') : 'Exam Portion',
        startPage: p.startPage,
        endPage: p.endPage
      }
    ];

    return {
      name: p.name,
      emoji: p.emoji,
      hue: p.hue,
      ranges: [[p.startPage, p.endPage]],
      portions
    };
  });
}

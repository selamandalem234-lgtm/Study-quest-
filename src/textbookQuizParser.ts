import { QuizQuestion, QuestionType } from './types.ts';

/**
 * Genuine Textbook Question Extractor
 * Extracts ONLY verbatim questions, review exercises, and chapter tests that already exist in the uploaded PDF.
 * Never invents, generates, rewords, or fabricates questions or options.
 */

interface SectionContext {
  title: string;
  unit: string;
  part: string;
}

// Regex patterns identifying genuine review and exercise sections in Ethiopian Grade 10 textbooks
const EXERCISE_SECTION_HEADER = /^(?:unit\s+\d+\s+review\s+questions?|review\s+questions?|unit\s+review\s+exercises?|review\s+exercises?|chapter\s+\d+\s+review|self[- ]assessment|self[- ]test|check\s+your\s+progress|exercises?\s+\d+(?:\.\d+)?|problems?\s+and\s+exercises?|part\s+[I|V|X|A-D]+|መልመጃ(?:\s+\d+)?|የክለሳ\s+ጥያቄዎች|ልምምድ|gaaffilee\s+shaakalaa|gaaffilee\s+qormaataa|qormaata\s+boqonnaa)\b/i;

const QUESTION_START_RE = /^(?:(?:\d{1,3}|[I|V|X]{1,4})[.)]\s+|question\s+\d{1,3}[:.]\s+|q\d{1,3}[.)]\s+|(?:\([0-9]{1,3}\)|\([a-z]\))\s+|[፩-፳][.)]\s+)/i;

const OPTION_LINE_RE = /^(?:([A-D]|[a-d]|[ሀ-መ])\s*[.)]\s+|(?:\(([A-D]|[a-d])\))\s+)(.*)$/;

const TRUE_FALSE_INDICATOR = /(?:write\s+["']?true["']?\s+or\s+["']?false["']?|state\s+whether\s+(?:each\s+of\s+)?the\s+following\s+statements?\s+(?:is|are)\s+true\s+or\s+false|true\s*\/\s*false|እውነት\s*ወይም\s*ሐሰት|dhugaa\s*yookaan\s*soba)/i;

const FILL_BLANK_INDICATOR = /(?:fill\s+in\s+the\s+blank|complete\s+(?:each\s+of\s+)?the\s+following\s+statements?|ባዶ\s*ቦታ(?:ውን)?\s*ሙላ|bakka\s+duwwaa\s+guut)/i;

const CALCULATION_INDICATOR = /\b(?:calculate|find\s+the|determine\s+the|compute|evaluate|what\s+is\s+the\s+(?:magnitude|velocity|acceleration|force|work|power|energy|mass|temperature|frequency|wavelength|current|voltage|resistance|molarity|concentration))\b/i;

/**
 * Parses raw textbook page text array and extracts all authentic textbook questions with page references.
 */
export function extractTextbookQuestions(
  subjectName: string,
  pages: string[],
  offset: number = 1
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  let currentSection: SectionContext = { title: '', unit: '', part: '' };

  // First pass: extract any textbook answer keys (e.g. from back of book or end of unit)
  const answerKeyMap: Record<string, string> = extractAnswerKeyMap(pages);

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const rawText = pages[pageIdx];
    if (!rawText || rawText.trim().length < 20) continue;

    // Printed textbook page number calibrated by offset
    const printedPage = pageIdx + offset;

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    let inQuestion = false;
    let currentQNum = '';
    let currentQText = '';
    let currentOptions: string[] = [];
    let currentPartHeader = currentSection.part;

    const finalizeCurrentQuestion = () => {
      if (!currentQText.trim() || currentQText.trim().length < 8) return;

      const qText = currentQText.trim();
      let qType: QuestionType = 'short_answer';

      if (currentOptions.length >= 2) {
        qType = 'multiple_choice';
      } else if (TRUE_FALSE_INDICATOR.test(currentPartHeader) || TRUE_FALSE_INDICATOR.test(qText)) {
        qType = 'true_false';
        currentOptions = ['True', 'False'];
      } else if (FILL_BLANK_INDICATOR.test(currentPartHeader) || /_{3,}|\.{4,}/.test(qText)) {
        qType = 'fill_in_blank';
      } else if (CALCULATION_INDICATOR.test(qText) || /[\d.]+\s*(?:m\/s|m\/s\^2|kg|N|J|W|Pa|V|A|Ω|mol|g|cm|°C|Hz)\b/i.test(qText)) {
        qType = 'calculation';
      }

      // Check verified answer key from textbook if present
      const keyId = `${currentQNum}`;
      const verified = answerKeyMap[keyId] || answerKeyMap[`p${printedPage}_q${currentQNum}`] || '';

      questions.push({
        id: `${subjectName}-p${printedPage}-q${currentQNum || questions.length + 1}`,
        page: printedPage,
        subject: subjectName,
        sectionTitle: currentSection.title || `${subjectName} Review`,
        questionNumber: currentQNum || `${questions.length + 1}`,
        type: qType,
        prompt: qText,
        text: qText,
        options: currentOptions.length ? currentOptions : undefined,
        answer: verified,
        verifiedAnswer: verified || undefined,
        hasVerifiedAnswer: !!verified,
        contextSnippet: lines.slice(0, 3).join(' ')
      });

      // Reset buffers
      currentQNum = '';
      currentQText = '';
      currentOptions = [];
      inQuestion = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect Unit / Chapter Header
      if (/^(?:unit|chapter|boqonnaa|ምዕራፍ)\s+\d+[:\- ]/i.test(line)) {
        currentSection.unit = line;
      }

      // Detect Exercise / Review Section Header
      if (EXERCISE_SECTION_HEADER.test(line)) {
        finalizeCurrentQuestion();
        currentSection.title = line;
        currentPartHeader = '';
        continue;
      }

      // Detect Section Subparts (Part I: Multiple Choice, Part II: True/False)
      if (/^part\s+[I|V|X|A-D]+[:\- ]/i.test(line) || TRUE_FALSE_INDICATOR.test(line) || FILL_BLANK_INDICATOR.test(line)) {
        finalizeCurrentQuestion();
        currentPartHeader = line;
        continue;
      }

      // Check if this line starts a new numbered question
      if (QUESTION_START_RE.test(line)) {
        finalizeCurrentQuestion();
        inQuestion = true;

        const match = line.match(QUESTION_START_RE);
        if (match) {
          currentQNum = match[0].replace(/[.)\s:]/g, '').trim();
          currentQText = line.slice(match[0].length).trim();
        } else {
          currentQText = line;
        }
        continue;
      }

      // Check if this line is an option (A, B, C, D) for the current question
      if (inQuestion) {
        const optMatch = line.match(OPTION_LINE_RE);
        if (optMatch) {
          currentOptions.push(line);
          continue;
        }

        // Inline options: "A. Option1  B. Option2  C. Option3  D. Option4"
        const inlineOpts = line.split(/(?=[A-D][.)]\s+)/);
        if (inlineOpts.length >= 2 && inlineOpts.every(o => OPTION_LINE_RE.test(o.trim()))) {
          inlineOpts.forEach(o => currentOptions.push(o.trim()));
          continue;
        }

        // Otherwise, it's a continuation of the question prompt text
        if (!OPTION_LINE_RE.test(line) && !QUESTION_START_RE.test(line)) {
          if (currentOptions.length === 0) {
            currentQText += (currentQText ? ' ' : '') + line;
          } else {
            // Continuation of the last option text
            const lastIdx = currentOptions.length - 1;
            currentOptions[lastIdx] += ' ' + line;
          }
        }
      }
    }

    finalizeCurrentQuestion();
  }

  return questions;
}

/**
 * Searches textbook pages for legitimate Answer Key sections provided by textbook publishers.
 */
function extractAnswerKeyMap(pages: string[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (let i = 0; i < pages.length; i++) {
    const text = pages[i];
    if (!/(?:answer\s+key|answers?\s+to\s+(?:review\s+)?(?:questions?|exercises?)|deebii|መልሶች)\b/i.test(text)) {
      continue;
    }

    const lines = text.split('\n');
    for (const line of lines) {
      // Matches "1. B", "2. D", "3. True", "4. A"
      const pairMatches = line.matchAll(/(?:^|\s+)(\d{1,3})[.)\s:]+([A-D]|True|False|እውነት|ሐሰት)/gi);
      for (const m of pairMatches) {
        map[m[1]] = m[2].toUpperCase();
      }
    }
  }

  return map;
}

/**
 * Selects questions for a quiz session from extracted authentic textbook questions.
 * Strictly adheres to rule: Randomize WHICH existing questions are selected, NOT the wording or content!
 */
export function selectTextbookQuestions(
  allQuestions: QuizQuestion[],
  startPage: number,
  endPage: number,
  options?: {
    count?: number;
    typeFilter?: 'all' | QuestionType;
    chapterFilter?: string;
  }
): QuizQuestion[] {
  const maxCount = options?.count || 8;
  const typeFilter = options?.typeFilter || 'all';

  // Filter questions within the target textbook page range
  let pool = allQuestions.filter(q => q.page >= startPage && q.page <= endPage);

  // If no questions in strict range, broaden to whole book so student can practice
  if (!pool.length) {
    pool = allQuestions;
  }

  // Filter by question type if requested
  if (typeFilter !== 'all') {
    const typeFiltered = pool.filter(q => q.type === typeFilter);
    if (typeFiltered.length > 0) {
      pool = typeFiltered;
    }
  }

  // Filter by chapter/section if specified
  if (options?.chapterFilter) {
    const chapFiltered = pool.filter(q =>
      q.sectionTitle?.toLowerCase().includes(options.chapterFilter!.toLowerCase())
    );
    if (chapFiltered.length > 0) {
      pool = chapFiltered;
    }
  }

  // Shuffle question indices to present a fresh practice set from the textbook
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, maxCount);
}

/**
 * Checks if a student's answer matches a verified textbook answer.
 */
export function checkAnswerAgainstTextbook(
  userAnswer: string,
  verifiedAnswer: string,
  type: QuestionType
): boolean {
  if (!verifiedAnswer || !userAnswer) return false;

  const cleanUser = userAnswer.trim().toUpperCase();
  const cleanKey = verifiedAnswer.trim().toUpperCase();

  if (type === 'multiple_choice') {
    // Check letter (A, B, C, D)
    const userLetter = cleanUser.match(/^[A-D]/)?.[0];
    const keyLetter = cleanKey.match(/^[A-D]/)?.[0];
    if (userLetter && keyLetter) return userLetter === keyLetter;
    return cleanUser === cleanKey;
  }

  if (type === 'true_false') {
    const userT = cleanUser.startsWith('T') || cleanUser === 'TRUE' || cleanUser === 'እውነት';
    const keyT = cleanKey.startsWith('T') || cleanKey === 'TRUE' || cleanKey === 'እውነት';
    return userT === keyT;
  }

  // Normalize whitespace and punctuation for fill-in-the-blank or calculation
  const normUser = cleanUser.replace(/[^\w\d.]/g, '');
  const normKey = cleanKey.replace(/[^\w\d.]/g, '');
  return normUser === normKey;
}

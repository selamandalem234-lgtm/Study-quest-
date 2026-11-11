import { BookMeta, QuizQuestion, QuizLogItem } from './types.ts';
import { byName, ord } from './constants.ts';
import { extractTextbookQuestions, selectTextbookQuestions } from './textbookQuizParser.ts';

// Deterministic candidate builder and quality gate
const PH = '';
const STOP = new Set(
  ('a an the and or but if of to in on at by for with from as is are was were be been being this that these those it its they them their there here which who whom whose what when where while than then also can may will would should could has have had not no do does did into onto over under between among about after before during through such each other more most some any all both only very one two three sometimes often usually always never generally mostly many several various different certain common however therefore because although another used made found called known given shown use uses using make makes made find finds found call calls called know knows known give gives given show shows shown more less much little quite rather too very almost nearly enough especially particularly frequently rarely seldom often generally mainly primarily perhaps maybe likely clearly simply usually together often now later first second third once twice every ever even still just already yet instead further thus hence otherwise moreover consequently nevertheless accordingly except including according via per their our your yours yourself themselves somebody someone something anything nothing everyone everything many much few several enough both either neither each such same different various particular another every all any no none both less least own whole entire certain several certain common general important significant large small high low good bad new old same only other first last next following previous above below figure table example page chapter section unit lesson topic results result shown discussed described mentioned given explained introduced defined means refers relates called known termed defined generally mostly different common typical usual usual similar various include includes including contains consists comprises requires involves occurs occurs become became becoming appear appears provide provides produces caused causes interrupted interrupts decrease decreases occurs occur grow grows growing live lives lived increases increased reduces reduced changes change changed affects affect affected moves move moved flows flow flowed produces produced transfers transfer transferred absorbs absorbed completes completed won wins uses used makes made').split(/\s+/)
);
const START_BAD = /^(?:sometimes|often|usually|always|never|generally|mostly|many|several|various|different|certain|common|it|this|these|those|they|he|she|we|you|your|however|but|and|also|then|therefore|thus|moreover|because|although|while|first|next|finally|in addition)\b/i;
const CONTEXT = /\b(?:above|below|following|previous|figure|fig\.|table|example|you|your|as mentioned|in this section|the text)\b/i;
const VAGUE_REFERENCE = /^(?:with\s+(?:an?\s+)?area\s+of|it\s+is\s+the\s+|they\s+are\s+the\s+|this\s+is\s+the\s+)/i;
const UNSAFE_SUPERLATIVE = /\b(?:largest|smallest|biggest|greatest|highest|lowest|longest|shortest|oldest|newest|fastest|slowest|deepest|widest|hottest|coldest|richest|poorest|most|least)\b/i;
const EXERCISE_RE = /^(?:exercises?|review|unit review|self[- ]?test|test yourself|check your|assignments?|assessment|practice|መልመጃ|ልምምድ|ክለሳ|ጥያቄ|shaakala|gaaffilee|gaaffii)\b/i;
const HEAD_RE = /^(?:unit|chapter|section|lesson|topic|objectives?|learning objectives|learning outcomes|key terms?|summary|glossary|references|contents|table of contents|activity|group work|worked example|ማውጫ|ይዘት|ማጠቃለያ|እንቅስቃሴ|qabiyyee|cuunfaa|hojii)\b/i;
const CAPTION_RE = /^(?:figure|fig\.?|table|diagram|graph|chart|illustration|photo|image)\s*\d/i;
const IMPER = /^(?:define|explain|calculate|find|solve|discuss|list|describe|write|choose|match|fill|complete|answer|identify|compare|draw|determine|prove|simplify|evaluate|give|name|read|look|observe|try|suppose|consider|assume|mention|predict|classify|label)\b/i;
const ABBR = /\b(?:e\.g|i\.e|etc|vs|Fig|fig|Dr|Mr|Mrs|Ms|approx|cf|Prof)\./g;
export const normAns = (x: string | number) =>
  String(x)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');

function tocPage(lines: string[]) {
  if (lines.slice(0, 4).some(l => /^(?:table of )?contents?$/i.test(l.trim()) || /^(?:ማውጫ|ይዘት|qabiyyee)$/i.test(l.trim()))) return true;
  const n = lines.filter(l => /(?:\.{3,}|…|\s)\d{1,3}\s*$/.test(l) && !/[.!?።]\s*$/.test(l)).length;
  return lines.length > 0 && n >= 5 && n / lines.length > 0.3;
}

function goodLine(l: string) {
  const w = l.split(/\s+/).length;
  if (/^\d+$/.test(l) || /\.3,}|…/.test(l) || CAPTION_RE.test(l) || /^(?:\d+[.)]|\(?[a-dA-D][.)]|[•▪●◦■□–-])\s/.test(l)) return false;
  if (HEAD_RE.test(l) && w <= 8) return false;
  if (/[A-Z]/.test(l) && l === l.toUpperCase() && w <= 12) return false;
  return true;
}

const joinLines = (a: string, b: string) => (/[A-Za-z]-$/.test(a) && /^[a-z]/.test(b) ? a.slice(0, -1) + b : a + ' ' + b);

function splitSentences(p: string) {
  return (
    p
      .replace(ABBR, m => m.slice(0, -1) + '\u0001')
      .match(/[\s\S]+?(?:[.!?]+(?=\s|$)|[።፧]+|$)/g) || []
  )
    .map(x => x.replace(/\u0001/g, '.').trim())
    .filter(Boolean);
}

export function pageSentences(text: string) {
  const lines = text.split('\n');
  if (tocPage(lines)) return [];
  const paras: string[] = [];
  let cur = '';
  const cut = () => {
    if (cur) paras.push(cur);
    cur = '';
  };
  for (const raw of lines) {
    const l = raw.trim(),
      w = l.split(/\s+/).length;
    if (!l) {
      cut();
      continue;
    }
    if (w <= 6 && EXERCISE_RE.test(l)) break;
    if (!goodLine(l)) {
      cut();
      continue;
    }
    cur = cur ? joinLines(cur, l) : l;
    if (/[.!?።፧]["'”’)\]]?$/.test(l)) cut();
  }
  cut();
  return paras.flatMap(splitSentences).filter(Boolean);
}

const TOK_RE = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
function tokens(s: string) {
  return [...s.matchAll(TOK_RE)].map(m => ({ w: m[0], i: m.index || 0 }));
}

function isStop(w: string, lang = 'en') {
  const x = w.toLowerCase();
  if (/ly$/i.test(x)) return true;
  if (STOP.has(x)) return true;
  if (lang === 'am') return ['እና', 'ወይም', 'ነው', 'ናቸው', 'ይህ', 'ይህን', 'እነዚህ', 'በ', 'ለ', 'ከ', 'ወደ', 'ላይ', 'ውስጥ', 'ብዙ'].includes(x);
  if (lang === 'om') return ['fi', 'yookaan', 'kan', 'kun', 'isaan', 'inni', 'ishee', 'akka', 'irra', 'keessa', 'gara', 'dha', 'taʼe', 'tahe', 'baayʼee'].includes(x);
  return false;
}

const GENERIC = new Set(
  ('process processes movement movements type types kind kinds form forms part parts result results amount amounts number numbers group groups series sustained sustain sustains carries carried carrying organelles organelle structure structures pattern patterns variety variation variations category categories activity activities feature features factor factors method methods aspect aspects member members situation situations condition conditions characteristic characteristics portion releases released releasing controls controlled controlling supports supported supporting allows allowed allowing enables enabled enabling performs performed performing develops developed developing remains remained maintains maintained maintaining protects protected protecting connects connected connecting converts converted converting contributes depends determines determined determining creates created creating transports transported transporting regulates regulated regulating').split(/\s+/)
);

const DEF_START = /^((?:(?:the|a|an)\s+)?[\p{L}][\p{L}'’-]*(?:\s+[\p{L}][\p{L}'’-]*){0,2})\s+(?:(?:is|are)\s+(?:called|known\s+as|defined\s+as|termed)|refers?\s+to|means|(?:is|are)\s+(?:a|an|the|one))\b/iu;

function defSubject(s: string) {
  const m = DEF_START.exec(s);
  if (!m) return null;
  let x = m[1],
    i = 0;
  const art = /^(?:the|a|an)\s+/i.exec(x);
  if (art) {
    i = art[0].length;
    x = x.slice(i);
  }
  const tk = x.split(/\s+/).map(z => z.toLowerCase());
  if (!x || tk.length > 3 || tk.some(z => STOP.has(z)) || tk.every(z => GENERIC.has(z))) return null;
  return { w: x, i };
}

function termSafe(t: { w: string; i: number; def?: boolean }, sentence: string, lang: string) {
  const w = t.w,
    n = [...w].length,
    lower = w.toLowerCase();
  if (t.def) return n >= 5 && /^[\p{L}][\p{L}'’ -]*$/u.test(w);
  if (/\s/.test(w)) {
    const parts = w.split(/\s+/);
    if (parts.length > 3 || n < 8) return false;
    if (parts.some(p => isStop(p, lang) || GENERIC.has(p.toLowerCase()) || [...p].length < 3)) return false;
    return parts.every(p => /^\p{L}[\p{L}'’-]*$/u.test(p));
  }
  if (GENERIC.has(lower)) return false;
  if (!/\p{L}/u.test(w) && !/^\d{4}$/.test(w)) return false;
  if (isStop(w, lang)) return false;
  if (/^\p{L}+$/u.test(w) && n < 5) return false;
  if (/^\p{L}+$/u.test(w) && n < 7 && !/^\p{Lu}/u.test(w)) return false;
  if (/^\p{L}+$/u.test(w) && /^\p{Lu}/u.test(w) && t.i === 0 && lang === 'en') return false;
  if (lang !== 'en' && /^\p{L}+$/u.test(w) && n < 7) return false;
  if (/^\p{L}+$/u.test(w) && !/^\p{Lu}/u.test(w) && !/^\p{L}{7,}$/u.test(w)) return false;
  if (
    /^\p{L}+$/u.test(w) &&
    /^\p{Lu}/u.test(w) &&
    t.i === 0 &&
    !/^[\p{L}][\p{L}'’-]*\s+(?:is|are)\s+(?:called|known as|defined as|termed|a|an|the)\b/iu.test(sentence)
  )
    return false;
  return true;
}

interface KeyCandidate {
  term: string;
  kind: string;
  priority: number;
  index: number;
  q?: number;
}

function keyCandidates(s: string, lang: string): KeyCandidate[] {
  const ts = tokens(s),
    out: KeyCandidate[] = [],
    add = (t: { w: string; i: number; def?: boolean } | null, kind: string, priority: number) => {
      if (t && /['’]s$/i.test(t.w)) t = { ...t, w: t.w.replace(/['’]s$/i, '') };
      if (t && termSafe(t, s, lang)) out.push({ term: t.w, kind, priority, index: t.i });
    };

  if (lang === 'en') {
    let m;
    const ds = defSubject(s);
    if (ds) add({ w: ds.w, i: ds.i, def: true }, 'definition', 120);
    const def1 = /\b([\p{L}][\p{L}'’-]*(?:\s+[\p{L}][\p{L}'’-]*){0,2})\s+(?:is|are)\s+(?:called|known as|defined as|termed)\s+([\p{L}][\p{L}'’-]*(?:\s+[\p{L}][\p{L}'’-]*){0,3})/giu;
    while ((m = def1.exec(s))) {
      const subject = tokens(m[1]).at(-1),
        pred = tokens(m[2])[0];
      if (subject) add({ w: subject.w, i: m.index }, 'definition', 100);
      if (pred) add({ w: pred.w, i: m.index + m[0].indexOf(m[2]) }, 'definition', 98);
    }
    const def2 = /\b([\p{L}][\p{L}'’-]*)\s+(?:refers to|means)\b/giu;
    while ((m = def2.exec(s))) {
      add({ w: m[1], i: m.index }, 'definition', 100);
    }
    const def3 = /\b([\p{L}][\p{L}'’-]*)\s+is\s+(?:a|an|the)\s+([\p{L}][\p{L}'’-]*)/giu;
    while ((m = def3.exec(s))) {
      add({ w: m[1], i: m.index }, 'definition', 95);
      add({ w: m[2], i: m.index + m[0].lastIndexOf(m[2]) }, 'definition', 94);
    }
    const also = /\b([\p{L}][\p{L}'’-]*),\s*also called\s+([\p{L}][\p{L}'’-]*)/giu;
    while ((m = also.exec(s))) add({ w: m[2], i: m.index + m[0].lastIndexOf(m[2]) }, 'definition', 96);
  }

  for (const m of s.matchAll(/\b(?:1[0-9]{3}|20[0-9]{2})\b/g)) add({ w: m[0], i: m.index || 0 }, 'date', 80);
  for (const m of s.matchAll(
    /\b\d+(?:\.\d+)?\s*(?:%|°C|°F|km\/h|km|cm|mm|m|kg|g|mg|L|ml|s|seconds?|minutes?|hours?|days?|years?|hectares?|acres?|volts?|watts?|joules?|newtons?|pascal(?:s)?|mol(?:es)?|Hz)\b/gi
  ))
    add({ w: m[0].trim(), i: m.index || 0 }, 'number', 78);

  if (lang === 'en') {
    for (const t of ts) if (t.i > 0 && /^\p{Lu}[\p{L}'’-]{2,}$/u.test(t.w) && !isStop(t.w, lang)) add(t, 'proper', 65);
    for (const t of ts) if (/^\p{L}{7,}$/u.test(t.w) && !isStop(t.w, lang)) add(t, 'technical', 40);

    for (let k = 0; k < ts.length; ) {
      let m = k;
      while (
        m < ts.length &&
        /^\p{Lu}[\p{L}]*$/u.test(ts[m].w) &&
        (m === k || s.slice(ts[m - 1].i + ts[m - 1].w.length, ts[m].i).trim() === '')
      )
        m++;
      if (m - k >= 2) {
        let a = k;
        while (a < m && STOP.has(ts[a].w.toLowerCase())) a++;
        if (m - a >= 2) add({ w: s.slice(ts[a].i, ts[m - 1].i + ts[m - 1].w.length), i: ts[a].i }, 'multi', 68);
      }
      k = Math.max(m, k + 1);
    }

    for (let k = 0; k < ts.length - 1; k++) {
      const a = ts[k],
        b = ts[k + 1];
      if (!/^\p{Ll}+$/u.test(a.w) || !/^\p{Ll}+$/u.test(b.w)) continue;
      if (s.slice(a.i + a.w.length, b.i).trim() !== '') continue;
      if (!/(?:^|\s)(?:the|an?|of|in|by|from|through|called|as|within|into)\s+$/i.test(s.slice(0, a.i))) continue;
      if ([a.w, b.w].some(x => isStop(x, lang) || GENERIC.has(x))) continue;
      if ([...a.w].length >= 4 && [...b.w].length >= 7 && !/(?:ing|ly)$/.test(a.w) && !/(?:ed|ing|ly|ous|ive|ful|less)$/.test(b.w))
        add({ w: a.w + ' ' + b.w, i: a.i }, 'multi', 55);
    }
  } else {
    for (const t of ts) if (/^\p{L}{7,}$/u.test(t.w) && !isStop(t.w, lang)) add(t, 'technical', 35);
  }
  return out;
}

function formsOf(w: string) {
  const x = w.toLowerCase();
  const forms = new Set([x]);
  if (x.length >= 5) {
    forms.add(x + 's');
    forms.add(x + 'es');
    if (x.endsWith('y')) forms.add(x.slice(0, -1) + 'ies');
    if (x.endsWith('e')) {
      forms.add(x.slice(0, -1) + 'ing');
      forms.add(x.slice(0, -1) + 'ed');
    } else {
      forms.add(x + 'ing');
      forms.add(x + 'ed');
    }
  }
  if (x.length >= 6) forms.add(x.slice(0, 6));
  return [...forms].filter(z => z.length >= 4);
}

function blankOut(sent: string, term: string) {
  const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [safe];
  if (/^\p{L}{7,}$/u.test(term)) patterns.push(term.slice(0, 6).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\p{L}*');
  return sent.replace(new RegExp('(^|[^\\p{L}\\p{N}])(?:' + patterns.join('|') + ')(?![\\p{L}\\p{N}])', 'giu'), (_, pre) => pre + PH);
}

const CONNECT_BAD = /\b(?:it|they|them|these|those|this|such|also|hence|thus|therefore|moreover|furthermore|similarly|likewise|consequently|however|nevertheless|respectively|latter|former|aforementioned|same|another|whereas|besides|meanwhile|thereby)\b/i;
const FILLER = /\b(?:important|importance|significant|vital|crucial|very|many|various|several|lots? of|a lot of|so-called|etc|and so on|in general|in some cases|for (?:example|instance)|such as|e\.g|i\.e)\b/i;
const BAD_OPEN = /^(?:for (?:example|instance)|in (?:addition|contrast|fact|particular|general|other words)|on the other hand|as a result|because of (?:this|that)|another|other|one|each|both|so|yet|or|nor|despite|although|though|whereas|after (?:this|that)|before (?:this|that))\b/i;
const JOINED = /\b[a-z]{2,}\s+(?:The|In|On|It|This|These|They|As|When|If|Some|Many|There|For|At|By|To)\s+[a-z]/;
const DEFV_RE = /\b(?:is called|are called|known as|refers? to|defined as|is defined|means|termed|is the (?:study|science|process|ability|branch|measure|movement))\b/i;
const CAUSE_RE = /\b(?:because|due to|caused by|causes|cause|results? in|resulted in|leads? to|led to|as a result of|responsible for|depends? on|formed by|formed when|are formed|is formed|occurs? when|located (?:in|on|at)|situated (?:in|on|at)|found (?:in|on|at)|flows? (?:into|through|from)|bounded by|consists? of|composed of|made up of|divided into|classified (?:as|into)|discovered|invented|founded|established|signed|declared|observed|began|ended|born|died|produces?|absorbs?|releases?|controls?|prevents?|protects?)\b/i;
const KIND_W: Record<string, number> = { definition: 35, date: 30, number: 20, proper: 12, multi: 15, technical: 0 };

function goodSentence(s: string, eth: string | boolean = false) {
  const lang = eth === 'am' ? 'am' : eth === 'om' ? 'om' : 'en',
    ts = tokens(s),
    n = ts.length;
  if (n < 10 || n > 30 || !/[.!?።]$/.test(s) || /[?፧]$/.test(s)) return false;
  if (START_BAD.test(s) || CONTEXT.test(s) || EXERCISE_RE.test(s) || HEAD_RE.test(s) || CAPTION_RE.test(s) || IMPER.test(s)) return false;
  if (/^with\s+(?:(?:an?|the)\s+)?(?:area|size|length|width|height|population)\s+of\b/i.test(s)) return false;
  if (/\b(?:square\s+kilometers?|square\s+kilometres?|km²|km\^2)\b/i.test(s) && /\bhot\s+desert\b/i.test(s)) return false;
  if (VAGUE_REFERENCE.test(s)) return false;

  if (lang === 'en') {
    if (CONNECT_BAD.test(s) || FILLER.test(s) || BAD_OPEN.test(s) || JOINED.test(s)) return false;
    if (/[:;]/.test(s) || /\b(?:Unit|Chapter|Section|Lesson|Figure|Fig|Table|Activity|Exercise|Page)\s*\.?\s*\d/.test(s)) return false;
    if (/\b[A-Z]\.$/.test(s) || (s.match(/["“”]/g) || []).length % 2) return false;
    if (ts.slice(1).filter(t => /^\p{Lu}/u.test(t.w)).length / n > 0.45) return false;
  }

  if (
    /\b(?:largest|biggest|greatest|highest|lowest|longest|shortest|oldest|newest|fastest|slowest|deepest|widest|hottest|coldest|richest|poorest)\b/i.test(s) &&
    !/\b(?:smallest\s+unit|smallest\s+particle|highest\s+temperature|lowest\s+temperature)\b/i.test(s)
  )
    return false;
  if (UNSAFE_SUPERLATIVE.test(s)) return false;
  if (/^[\s•▪●◦■□\-–\d(]/.test(s) || /[=<>→←±×÷∑√]/.test(s)) return false;
  if (/\[[^\]]*\]|\([^)]*\)/.test(s)) return false;
  if (lang === 'en' && !/^[A-Z]/.test(s)) return false;
  if (!/[\p{L}]/u.test(s)) return false;
  return true;
}

export const lev = (a: string, b: string) => {
  const x = [...a],
    y = [...b];
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const cur = [i];
    for (let j = 1; j <= y.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[y.length];
};

export function sameAnswer(inp: string, ans: string): boolean {
  const x = normAns(inp),
    y = normAns(ans),
    n = [...y].length;
  if (!x) return false;
  if (x === y) return true;
  if (/^\d/.test(y)) return false;
  if (n >= 5 && (x === y + 's' || x + 's' === y || x === y + 'es' || x + 'es' === y)) return true;
  return n >= 8 && lev(x, y) <= 1;
}

function sentScore(s: string, lang: string) {
  const ts = tokens(s),
    n = ts.length;
  let q = lang === 'en' ? 0 : 20;
  if (defSubject(s) || DEFV_RE.test(s)) q += 35;
  if (CAUSE_RE.test(s)) q += 20;
  if (/\b(?:1[0-9]{3}|20[0-9]{2})\b/.test(s)) q += 20;
  if (/\b\d+(?:\.\d+)?\s*(?:°C|°F|km|cm|mm|kg|mg|g|m|L|ml|years?|days?|hours?|minutes?|seconds?|hectares?|meters?|metres?|kilometers?|kilometres?)\b/i.test(s)) q += 10;
  const caps = ts.slice(1).filter(t => /^\p{Lu}/u.test(t.w)).length;
  if (caps >= 1 && caps <= 4) q += 10;
  if (n >= 12 && n <= 26) q += 10;
  return q;
}

function blankScore(sent: string, c: KeyCandidate, lang: string, ss: number) {
  const t = c.term,
    multi = /\s/.test(t),
    before = sent.slice(0, c.index),
    after = sent.slice(c.index + t.length);
  const isNum = c.kind === 'date' || c.kind === 'number';
  if (!isNum && (/^['’]?s?\s*(?:,|\/|;|\)|\b(?:or|and|nor)\b)/i.test(after) || /\b(?:or|and|nor|but|between)\s+(?:the\s+|an?\s+)?$/i.test(before))) return -1;
  const restTok = tokens(before + ' ' + after).filter(x => [...x.w].length >= 6 && !isStop(x.w, lang)).length;
  if (lang === 'en') {
    if (restTok < (isNum ? 1 : 2)) return -1;
    if (c.kind === 'technical') {
      if (/(?:ed|ing|ly|ous|ive|ful|less|able|ible)$/i.test(t) || c.index < 6) return -1;
      if (
        /\b(?:part|kind|type|types|form|forms|number|variety|range|series|set|group|sort|piece|lot|amount|level|sense|way|ways|case|cases|result|one|some|all|each)\s+of\s+(?:an?|the|their|its)?\s*$/i.test(
          before
        )
      )
        return -1;
      if (!(DEFV_RE.test(sent) || CAUSE_RE.test(sent))) return -1;
    }
    if (c.kind === 'proper' && /^\s+[a-z]{4,}/.test(after) && !isStop(after.trim().split(/\s+/)[0], lang)) return -1;
    if (c.kind === 'proper' && !(defSubject(sent) || DEFV_RE.test(sent) || CAUSE_RE.test(sent) || /\b(?:1[0-9]{3}|20[0-9]{2})\b/.test(sent))) return -1;
  }
  return ss + (KIND_W[c.kind] || 0) + (multi ? 10 : 0) + Math.min(restTok, 4) * 2;
}

const QZ_MEM = new Map<string, { n: number; last: Map<string, number> }>();
const formsFor = (w: string) => (/\s/.test(w) ? tokens(w).filter(z => [...z.w].length >= 5).flatMap(z => formsOf(z.w)) : formsOf(w));

export function makeQuiz(
  pages: string[],
  a: number,
  b: number,
  off: number,
  _simple: boolean,
  _eth: string | boolean,
  opts: { rand?: () => number; boost?: Record<number, number>; key?: string } = {},
  _quizBlocklist: string[] = []
): QuizQuestion[] {
  const subjectKey = opts.key || 'Textbook';
  // Use genuine textbook review & exercise questions only
  const allExtracted = extractTextbookQuestions(subjectKey, pages, off);
  return selectTextbookQuestions(allExtracted, a, b, { count: 8 });
}

// IndexedDB storage for offline textbook text
let dbp: Promise<IDBDatabase> | null = null;
export function openDB(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    if (typeof window === 'undefined' || !window.indexedDB) return rej(new Error('nodb'));
    try {
      const rq = indexedDB.open('study-quest-books', 1);
      rq.onupgradeneeded = () => {
        ['meta', 'text'].forEach(n => rq.result.createObjectStore(n, { keyPath: 'subject' }));
      };
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(new Error('nodb'));
    } catch (e) {
      rej(new Error('nodb'));
    }
  });
  dbp.catch(() => {
    dbp = null;
  });
  return dbp;
}

const idbReq = <T>(rq: IDBRequest<T>): Promise<T> =>
  new Promise((res, rej) => {
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });

export async function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return idbReq(db.transaction(store).objectStore(store).get(key));
}

export async function idbAll<T>(store: string): Promise<T[]> {
  const db = await openDB();
  return idbReq(db.transaction(store).objectStore(store).getAll());
}

export async function idbWrite(fn: (metaStore: IDBObjectStore, textStore: IDBObjectStore) => void): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(['meta', 'text'], 'readwrite');
    tx.oncomplete = () => res();
    tx.onerror = tx.onabort = () => rej(new Error('save'));
    fn(tx.objectStore('meta'), tx.objectStore('text'));
  });
}

let bookCache: { name: string; pages: string[] } | null = null;
export async function getBookPages(name: string): Promise<string[]> {
  if (bookCache && bookCache.name === name) return bookCache.pages;
  const rec = await idbGet<{ subject: string; pages: string[] }>('text', name);
  if (!rec || !Array.isArray(rec.pages)) throw new Error('nobook');
  bookCache = { name, pages: rec.pages };
  return rec.pages;
}

// PDF.js dynamic loader
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
let pdfP: Promise<any> | null = null;
export function loadPdfJs(): Promise<any> {
  if ((window as any).pdfjsLib) return Promise.resolve((window as any).pdfjsLib);
  if (pdfP) return pdfP;
  pdfP = new Promise((res, rej) => {
    const sc = document.createElement('script');
    const timer = setTimeout(() => {
      sc.remove();
      rej(new Error('nolib'));
    }, 25000);
    sc.src = PDFJS + 'pdf.min.js';
    sc.onload = () => {
      clearTimeout(timer);
      if ((window as any).pdfjsLib) {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js';
        res((window as any).pdfjsLib);
      } else rej(new Error('nolib'));
    };
    sc.onerror = () => {
      clearTimeout(timer);
      sc.remove();
      rej(new Error('nolib'));
    };
    document.head.append(sc);
  });
  pdfP.catch(() => {
    pdfP = null;
  });
  return pdfP;
}

const LIG: Record<string, string> = { 'ﬀ': 'ff', 'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬃ': 'ffi', 'ﬄ': 'ffl' };
const cleanStr = (s: string) =>
  s
    .replace(/[ﬀ-ﬄ]/g, c => LIG[c] || c)
    .replace(/[­]/g, '')
    .replace(/[  -  ]/g, ' ')
    .replace(/[\u0000-\u0008\u000B-\u001F]/g, ' ');

function itemsToText(items: any[]): string {
  const lines: string[] = [];
  let line = '',
    px: number | null = null,
    pw = 0,
    py = 0;
  for (const it of items) {
    if (typeof it.str !== 'string') continue;
    const str = cleanStr(it.str),
      x = it.transform ? it.transform[4] : 0,
      y = it.transform ? it.transform[5] : 0,
      h = it.height || 10;
    if (px !== null) {
      if (Math.abs(y - py) >= h * 0.6) {
        lines.push(line);
        line = '';
      } else if (x - (px + pw) > h * 0.15 && !/\s$/.test(line) && !/^\s/.test(str)) line += ' ';
    }
    line += str;
    px = x;
    pw = it.width || 0;
    py = y;
    if (it.hasEOL) {
      lines.push(line);
      line = '';
      px = null;
    }
  }
  if (line) lines.push(line);
  return lines
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

export async function importBook(name: string, file: File, say: (msg: string) => void): Promise<boolean> {
  try {
    say('Loading the local PDF reader…');
    const lib = await loadPdfJs();
    say('Opening textbook PDF…');
    const pdf = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const n = pdf.numPages,
      pages: string[] = [];
    let textPages = 0;
    for (let i = 1; i <= n; i++) {
      if (i === 1 || i % 4 === 0 || i === n) say(`Reading page ${i} of ${n}…`);
      const pg = await pdf.getPage(i),
        txt = itemsToText((await pg.getTextContent()).items);
      pages.push(txt);
      if (txt.replace(/\s/g, '').length >= 40) textPages++;
      pg.cleanup();
      if (i % 4 === 0) await new Promise(r => setTimeout(r, 0));
    }
    pdf.destroy();
    if (!textPages || textPages / n < 0.1) {
      say('This PDF has no extractable text (it appears to be image scans). Please choose a searchable textbook PDF.');
      return false;
    }
    const meta: BookMeta = {
      subject: name,
      name: file.name || 'book.pdf',
      pageCount: n,
      textPages,
      savedAt: Date.now()
    };
    await idbWrite((m, t) => {
      m.put(meta);
      t.put({ subject: name, pages });
    });
    bookCache = { name, pages };
    say(`Saved ${meta.name}: ${textPages} of ${n} pages ready for quizzes!`);
    return true;
  } catch (err: any) {
    const c = err && err.message;
    say(
      c === 'nolib'
        ? 'Could not connect to the PDF engine. Check internet connection for initial load.'
        : 'Could not read that PDF. Please try another copy.'
    );
    return false;
  }
}

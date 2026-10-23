/**
 * Job-description keyword matching.
 *
 * Pulls the terms a posting leans on (tools, skills, domain phrases) and
 * reports which ones the resume already uses. It is deliberately simple and
 * fully local: tokenise, drop filler words, keep repeated or skill-shaped
 * terms, and compare against the resume's plain text with common aliases
 * folded together (JS ↔ JavaScript, Postgres ↔ PostgreSQL, …).
 */

export interface Keyword {
  term: string;
  /** How often the posting uses it. */
  count: number;
}

export interface KeywordMatch {
  matched: Keyword[];
  missing: Keyword[];
  /** Share of extracted keywords present in the resume, 0–100. */
  score: number;
}

const STOPWORDS = new Set(
  `a about above across after again against all also am an and any are as at be because been before being below
  between both but by can could did do does doing down during each either else etc ever every few for from further
  get gets getting give given go going had has have having he her here hers him his how however i if in into is it
  its itself just least less let like make makes making many may me might more most much must my need needs new no
  nor not now of off on once one only or other our ours out over own per plus please rather same she should so some
  such than that the their theirs them then there these they this those through to too under until up upon us use
  used using very via want was we well were what when where whether which while who whom whose why will with within
  without would yet you your yours ability able across advantage apply applicant applicants applying bachelor
  benefit benefits bonus candidate candidates closely company competitive culture day degree demonstrated desirable
  equivalent environment excellent experience experienced familiarity fast field good great help ideal ideally include
  includes including job join knowledge level looking minimum month months nice offer opportunity paced plus position
  preferred proven related required requirement requirements responsibilities responsible role salary seeking skill
  skills solid strong success successful team teams understanding work working world year years senior junior
  mid lead staff principal head engineer engineers developer developers manager managers mentor mentoring hire
  hiring remote hybrid onsite office full-time part-time contract based`
    .split(/\s+/)
    .filter(Boolean),
);

/** Spelling variants folded to one canonical token before matching. */
const ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  "node.js": "node",
  nodejs: "node",
  "react.js": "react",
  reactjs: "react",
  "next.js": "next",
  nextjs: "next",
  "vue.js": "vue",
  vuejs: "vue",
  postgres: "postgresql",
  psql: "postgresql",
  k8s: "kubernetes",
  golang: "go",
  "amazon web services": "aws",
  "google cloud": "gcp",
  "ci/cd": "cicd",
  "ci-cd": "cicd",
  ml: "machine learning",
  "rest api": "rest",
  restful: "rest",
};

/** Short tokens that are real skills rather than noise. */
const SHORT_TERMS = new Set([
  "go",
  "r",
  "c",
  "ai",
  "ml",
  "ui",
  "ux",
  "qa",
  "c#",
  "c++",
  "f#",
  "js",
  "ts",
  "qa",
  "aws",
  "gcp",
  "sql",
  "api",
  "css",
  "php",
  "seo",
  "etl",
  "sre",
  "ios",
  "git",
]);

const TOKEN = /[a-z0-9][a-z0-9+#./-]*[a-z0-9+#]|[a-z0-9]/g;

export function tokens(text: string): string[] {
  return (text.toLowerCase().match(TOKEN) ?? []).map((t) =>
    t.replace(/[.]+$/, ""),
  );
}

export const canon = (term: string) => ALIASES[term] ?? term;

export const usable = (t: string) =>
  !STOPWORDS.has(t) && !/^\d+$/.test(t) && (t.length > 2 || SHORT_TERMS.has(t));

/** The terms a job description emphasises, most important first. */
export function extractKeywords(jobText: string, limit = 30): Keyword[] {
  const toks = tokens(jobText);
  const counts = new Map<string, number>();
  const bump = (k: string) => counts.set(k, (counts.get(k) ?? 0) + 1);

  for (let i = 0; i < toks.length; i++) {
    const a = toks[i];
    if (usable(a)) bump(a);
    const b = toks[i + 1];
    if (b && usable(a) && usable(b)) bump(`${a} ${b}`);
  }

  // Terms written with capitals or symbols in the posting ("Kubernetes",
  // "CI/CD", "C#") are almost always named tools, even when used once.
  const named = new Set(
    (
      jobText.match(
        /\b[A-Z][A-Za-z0-9+#./-]*[A-Za-z0-9+#]|\b[A-Za-z]+[+#/.][A-Za-z0-9+#]*/g,
      ) ?? []
    )
      .map((t) => t.toLowerCase())
      .filter(usable),
  );

  const candidates = [...counts.entries()]
    .filter(([term, n]) => {
      const isPhrase = term.includes(" ");
      if (isPhrase) return n >= 2;
      return n >= 2 || named.has(term) || SHORT_TERMS.has(term);
    })
    .map(([term, count]) => ({ term, count }));

  // Drop a single word when a phrase containing it carries most of its
  // uses ("stack" inside "full stack").
  const phrases = candidates.filter((c) => c.term.includes(" "));
  const kept = candidates.filter(
    (c) =>
      c.term.includes(" ") ||
      !phrases.some(
        (p) => p.term.split(" ").includes(c.term) && p.count * 1.5 >= c.count,
      ),
  );

  // Fold aliases so "JS" and "JavaScript" count once.
  const merged = new Map<string, Keyword>();
  for (const k of kept) {
    const key = canon(k.term);
    const prev = merged.get(key);
    if (prev) prev.count += k.count;
    else merged.set(key, { term: k.term, count: k.count });
  }

  return [...merged.values()]
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, limit);
}

function containsTerm(haystack: Set<string>, phraseText: string, term: string) {
  if (term.includes(" ")) return phraseText.includes(` ${term} `);
  return haystack.has(canon(term)) || haystack.has(term);
}

export function matchKeywords(
  jobText: string,
  resumeText: string,
): KeywordMatch {
  const keywords = extractKeywords(jobText);
  const resumeTokens = tokens(resumeText);
  const tokenSet = new Set(resumeTokens.flatMap((t) => [t, canon(t)]));
  const phraseText = ` ${resumeTokens.join(" ")} `;

  const matched: Keyword[] = [];
  const missing: Keyword[] = [];
  for (const k of keywords) {
    (containsTerm(tokenSet, phraseText, k.term) ? matched : missing).push(k);
  }
  const score = keywords.length
    ? Math.round((matched.length / keywords.length) * 100)
    : 0;
  return { matched, missing, score };
}

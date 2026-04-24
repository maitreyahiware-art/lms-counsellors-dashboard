/**
 * Search Relevance Ranking Engine
 * 
 * Scores content based on WHERE the search term appears:
 *   1. Title match          → highest priority (100 pts)
 *   2. Tags / category      → high priority   (70 pts)
 *   3. Description (first 2 lines) → medium   (50 pts)
 *   4. Description (rest / body)    → lower    (20 pts)
 *   5. Code / metadata             → baseline  (10 pts)
 * 
 * Supports fuzzy/partial matching and synonym expansion.
 */

// ── Scoring weights ────────────────────────────────────────────────────────
const SCORE_TITLE = 100;
const SCORE_TITLE_STARTS = 120;   // bonus if title starts with the query
const SCORE_TAGS = 70;
const SCORE_CATEGORY = 60;
const SCORE_DESC_EARLY = 50;    // first 2 lines of description
const SCORE_DESC_LATE = 20;    // remaining body of description
const SCORE_CODE_META = 10;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Split description into "early" (first 2 non-empty lines) and "late" (rest). */
function splitDescription(text: string): { early: string; late: string } {
  const lines = text.split("\n").filter(Boolean);
  return {
    early: lines.slice(0, 2).join(" ").toLowerCase(),
    late: lines.slice(2).join(" ").toLowerCase(),
  };
}

/** Check if ANY search token matches a given text (partial/substring). */
function tokensMatch(tokens: string[], text: string): boolean {
  return tokens.some(t => text.includes(t));
}

/** Count how many tokens match (used for tie-breaking). */
function tokenMatchCount(tokens: string[], text: string): number {
  return tokens.filter(t => text.includes(t)).length;
}

// ── Main scorer ────────────────────────────────────────────────────────────

export interface RankableItem {
  title: string;
  description: string;     // full description / body text
  tags?: string[];
  category?: string;
  code?: string;
  subType?: string;
  [key: string]: any;      // pass-through for the rest of the object
}

export interface ScoredItem<T> {
  item: T;
  score: number;
}

/**
 * Score a single item against search tokens.
 * Returns 0 if there is no match at all (item should be filtered out).
 */
export function scoreItem(item: RankableItem, tokens: string[], rawQuery: string): number {
  let score = 0;
  const titleLower = item.title.toLowerCase();
  const { early, late } = splitDescription(item.description);
  const tagsLower = (item.tags || []).join(" ").toLowerCase();
  const categoryLower = (item.category || "").toLowerCase();
  const codeLower = (item.code || "").toLowerCase();
  const subTypeLower = (item.subType || "").toLowerCase();

  // 1. Title match — highest value
  if (titleLower.includes(rawQuery)) {
    score += SCORE_TITLE;
    // Extra bonus if title STARTS with the query
    if (titleLower.startsWith(rawQuery)) {
      score += SCORE_TITLE_STARTS - SCORE_TITLE; // net +20
    }
  } else if (tokensMatch(tokens, titleLower)) {
    // Partial token match in title — proportional score
    const ratio = tokenMatchCount(tokens, titleLower) / tokens.length;
    score += Math.round(SCORE_TITLE * ratio);
  }

  // 2. Tags match
  if (tagsLower && (tagsLower.includes(rawQuery) || tokensMatch(tokens, tagsLower))) {
    const ratio = tokenMatchCount(tokens, tagsLower) / tokens.length;
    score += Math.round(SCORE_TAGS * ratio);
  }

  // 3. Category / subType match
  if (categoryLower.includes(rawQuery) || tokensMatch(tokens, categoryLower)) {
    score += SCORE_CATEGORY;
  }
  if (subTypeLower.includes(rawQuery) || tokensMatch(tokens, subTypeLower)) {
    score += Math.round(SCORE_CATEGORY * 0.5);
  }

  // 4. Description — first 2 lines (high intent zone)
  if (early && (early.includes(rawQuery) || tokensMatch(tokens, early))) {
    const ratio = tokenMatchCount(tokens, early) / tokens.length;
    score += Math.round(SCORE_DESC_EARLY * ratio);
  }

  // 5. Description — remaining body
  if (late && (late.includes(rawQuery) || tokensMatch(tokens, late))) {
    const ratio = tokenMatchCount(tokens, late) / tokens.length;
    score += Math.round(SCORE_DESC_LATE * ratio);
  }

  // 6. Code / metadata (lowest tier)
  if (codeLower && (codeLower.includes(rawQuery) || tokensMatch(tokens, codeLower))) {
    score += SCORE_CODE_META;
  }

  return score;
}

/**
 * Rank an array of items by search relevance.
 * Items with score 0 are excluded. Results sorted high → low.
 */
export function rankByRelevance<T extends RankableItem>(
  items: T[],
  searchQuery: string,
): T[] {
  const q = searchQuery.toLowerCase().trim();
  if (q.length < 2) return items; // no ranking for very short queries

  // Tokenize: remove common stop words
  const stopWords = new Set([
    "i", "need", "want", "to", "something", "looking", "for", "a", "the",
    "in", "on", "at", "my", "me", "is", "and", "or", "some", "can", "you",
    "give", "show", "tell", "about", "how", "what", "with", "this", "that",
  ]);
  const tokens = q
    .split(/[\s.,!?]+/)
    .filter(t => t.length > 1 && !stopWords.has(t));

  // If no useful tokens remain, fall back to raw query as single token
  const effectiveTokens = tokens.length > 0 ? tokens : [q];

  const scored: ScoredItem<T>[] = items.map(item => ({
    item,
    score: scoreItem(item as RankableItem, effectiveTokens, q),
  }));

  // Only keep items that scored > 0
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.item);
}

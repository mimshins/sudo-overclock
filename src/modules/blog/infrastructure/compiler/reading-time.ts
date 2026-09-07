/*
 * Reading time estimation.
 *
 * Word-count based estimate run at compile time. Code fences are stripped
 * before counting so a post dominated by code doesn't inflate the estimate.
 * Results are floored at one minute.
 */

const WORDS_PER_MINUTE = 200;

const CODE_FENCE_PATTERN = /```[\s\S]*?```|~~~[\s\S]*?~~~/gu;

const stripCodeFences = (markdown: string): string =>
  markdown.replace(CODE_FENCE_PATTERN, " ");

const countWords = (text: string): number =>
  text
    .trim()
    .split(/\s+/u)
    .filter(word => word !== "").length;

const estimateReadingTimeMinutes = (markdown: string): number =>
  Math.max(
    1,
    Math.ceil(countWords(stripCodeFences(markdown)) / WORDS_PER_MINUTE),
  );

export { WORDS_PER_MINUTE, estimateReadingTimeMinutes };

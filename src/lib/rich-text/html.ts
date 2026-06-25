/**
 * Lightweight, dependency-free helpers for the rich-text question content.
 *
 * Question text is stored either as plain text (legacy exams, bulk import) or
 * as HTML produced by the in-app editor (bold / italic / underline / lists /
 * tables). These helpers are written without DOMParser so they run safely on
 * the server during SSR as well as in the browser.
 */

/** Tags the editor is allowed to emit; everything else is unwrapped. */
const ALLOWED_TAGS = new Set([
  "p", "br", "div", "span",
  "b", "strong", "i", "em", "u", "s", "strike",
  "sup", "sub",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "td", "th",
  "h1", "h2", "h3",
]);

const HTML_TAG_RE = /<\/?(p|div|br|b|strong|i|em|u|s|strike|sup|sub|ul|ol|li|table|tr|td|th|thead|tbody|span|h1|h2|h3)\b/i;

/** Does this string contain rich-text markup, or is it plain text? */
export function isHtml(value: string): boolean {
  return HTML_TAG_RE.test(value);
}

/** Pull a safe text-align value out of a tag's raw attribute string. */
function extractAlign(attrs: string): "" | "left" | "right" | "center" | "justify" {
  const style = /style\s*=\s*"([^"]*)"/i.exec(attrs) ?? /style\s*=\s*'([^']*)'/i.exec(attrs);
  if (style) {
    const ta = /text-align\s*:\s*(left|right|center|justify)/i.exec(style[1]);
    if (ta) return ta[1].toLowerCase() as "left" | "right" | "center" | "justify";
  }
  const align = /\balign\s*=\s*["']?(left|right|center|justify)\b/i.exec(attrs);
  if (align) return align[1].toLowerCase() as "left" | "right" | "center" | "justify";
  return "";
}

/**
 * Strip everything except the whitelisted tags. All attributes are dropped
 * except a normalised `text-align` (preserved as an inline style) so paragraph
 * alignment survives. Safe against scripts / event handlers / arbitrary styles.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  // Remove dangerous element bodies entirely.
  let s = html.replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, "");
  // Normalise tags: keep allowed ones (only a safe text-align survives), drop the rest.
  s = s.replace(/<(\/?)\s*([a-zA-Z0-9]+)([^>]*?)(\/?)>/g, (_m, slash: string, tag: string, attrs: string, selfClose: string) => {
    const t = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(t)) return "";
    if (t === "br") return "<br>";
    if (slash) return `</${t}>`;
    const align = extractAlign(attrs);
    const styleAttr = align ? ` style="text-align:${align}"` : "";
    return `<${t}${styleAttr}${selfClose ? " /" : ""}>`;
  });
  return s;
}

/** Convert HTML (or plain text) into a readable plain-text approximation. */
export function htmlToPlainText(value: string): string {
  if (!isHtml(value)) return value;
  return value
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, "")
    .replace(/<\s*(br|\/p|\/div|\/li|\/tr|\/h[1-3])\s*\/?\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

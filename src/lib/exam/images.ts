import type { BaseQuestion, QuestionImage } from "@/types";

/**
 * Normalise a question's images into a single ordered list with optional
 * sizing. Prefers the structured `images[]`, falling back to the legacy
 * `image_urls[]` / single `image_url` so older exams keep rendering.
 */
export function questionImages(
  q: Pick<BaseQuestion, "image_url" | "image_urls" | "images">,
): QuestionImage[] {
  if (q.images?.length) return q.images;
  const urls = [...(q.image_urls ?? [])];
  if (q.image_url && !urls.includes(q.image_url)) urls.unshift(q.image_url);
  return urls.map((url) => ({ url }));
}

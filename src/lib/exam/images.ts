import type { BaseQuestion } from "@/types";

/**
 * Combine the legacy single `image_url` with the newer `image_urls[]` into one
 * ordered, de-duplicated list. Legacy image (if any) comes first so existing
 * exams keep rendering their original image.
 */
export function questionImages(q: Pick<BaseQuestion, "image_url" | "image_urls">): string[] {
  const list = [...(q.image_urls ?? [])];
  if (q.image_url && !list.includes(q.image_url)) list.unshift(q.image_url);
  return list;
}

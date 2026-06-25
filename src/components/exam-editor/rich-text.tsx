"use client";

import { isHtml, sanitizeHtml } from "@/lib/rich-text/html";

interface Props {
  value: string;
  className?: string;
}

/**
 * Renders question content. HTML produced by the rich-text editor is sanitised
 * and rendered as markup; legacy plain text is rendered with line breaks
 * preserved. Used by the runner, preview, grader and anywhere a question's
 * text is shown so they all match what the editor produced.
 */
export function RichText({ value, className }: Props) {
  if (isHtml(value)) {
    return (
      <div
        className={`rich-content ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
      />
    );
  }
  return <div className={`rich-content whitespace-pre-wrap ${className ?? ""}`}>{value}</div>;
}

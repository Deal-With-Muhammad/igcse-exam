import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Exam, Question, Template } from "@/types";
import { isHtml, sanitizeHtml } from "@/lib/rich-text/html";
import { questionImages } from "@/lib/exam/images";

const MARGIN_X = 18;
const PAGE_HEIGHT = 297;
const PAGE_WIDTH = 210;
const FOOTER_Y = PAGE_HEIGHT - 12;

// jsPDF's built-in fonts only cover WinAnsi (Latin-1), so superscripts,
// subscripts and most math symbols (√ ≤ ≥ ≠ π θ → ∑ …) don't render. We embed
// DejaVu Sans (broad Unicode coverage) and use it for all body text so every
// special character and formula prints correctly.
const BODY_FONT = "DejaVuSans";

function abToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// Fetch + base64-encode the fonts once, then reuse across exports.
let fontCache: { normal: string; bold: string } | null = null;
async function loadFontData() {
  if (fontCache) return fontCache;
  const [normal, bold] = await Promise.all([
    fetch("/fonts/DejaVuSans.ttf").then((r) => r.arrayBuffer()),
    fetch("/fonts/DejaVuSans-Bold.ttf").then((r) => r.arrayBuffer()),
  ]);
  fontCache = { normal: abToBase64(normal), bold: abToBase64(bold) };
  return fontCache;
}

function registerFonts(doc: jsPDF, data: { normal: string; bold: string }) {
  doc.addFileToVFS("DejaVuSans.ttf", data.normal);
  doc.addFont("DejaVuSans.ttf", BODY_FONT, "normal");
  doc.addFileToVFS("DejaVuSans-Bold.ttf", data.bold);
  doc.addFont("DejaVuSans-Bold.ttf", BODY_FONT, "bold");
  // No oblique file — alias italic to the normal face so setFont(_, "italic")
  // never throws (it just renders upright).
  doc.addFont("DejaVuSans.ttf", BODY_FONT, "italic");
}

interface RenderCtx {
  doc: jsPDF;
  y: number;
  page: number;
  totalPages?: number;
}

const ensureSpace = (ctx: RenderCtx, needed: number) => {
  if (ctx.y + needed > FOOTER_Y - 6) {
    ctx.doc.addPage();
    ctx.page += 1;
    ctx.y = 20;
  }
};

async function fetchImage(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve({ data: reader.result as string, w: img.width, h: img.height });
        img.onerror = () => resolve(null);
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

function imgFormat(dataUrl: string): "PNG" | "JPEG" {
  return /^data:image\/jpe?g/i.test(dataUrl) ? "JPEG" : "PNG";
}

/* ----------------------------------------------------------------------------
 * Rich-text rendering
 *
 * Question text is HTML (bold / italic / underline / lists / tables) produced
 * by the editor, or plain text for legacy exams. We parse it into blocks and
 * render them onto the PDF so the printed paper matches the on-screen exam.
 * ------------------------------------------------------------------------- */

interface Inline { text: string; bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; sup?: boolean; sub?: boolean }
type Align = "left" | "center" | "right" | "justify";
type RichBlock =
  | { kind: "para"; runs: Inline[]; align: Align }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "table"; head: string[] | null; rows: string[][] };

function readAlign(el: HTMLElement): Align {
  const ta = (el.style?.textAlign || el.getAttribute("align") || "").toLowerCase();
  return ta === "center" || ta === "right" || ta === "justify" ? ta : "left";
}

function collectInline(node: Node, style: Inline, out: Inline[]) {
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      const t = child.textContent ?? "";
      if (t) out.push({ ...style, text: t });
      return;
    }
    if (child.nodeType !== 1) return;
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === "br") { out.push({ ...style, text: "\n" }); return; }
    const ns: Inline = { ...style };
    if (tag === "b" || tag === "strong") ns.bold = true;
    if (tag === "i" || tag === "em") ns.italic = true;
    if (tag === "u") ns.underline = true;
    if (tag === "s" || tag === "strike") ns.strike = true;
    if (tag === "sup") ns.sup = true;
    if (tag === "sub") ns.sub = true;
    collectInline(el, ns, out);
  });
}

function parseRichBlocks(html: string): RichBlock[] {
  const doc = new DOMParser().parseFromString(`<div id="r">${sanitizeHtml(html)}</div>`, "text/html");
  const root = doc.getElementById("r");
  const blocks: RichBlock[] = [];
  let current: Inline[] = [];
  const flush = () => {
    if (current.some((r) => r.text.trim())) blocks.push({ kind: "para", runs: current, align: "left" });
    current = [];
  };
  root?.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      const t = node.textContent ?? "";
      if (t.trim()) current.push({ text: t });
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (["p", "div", "h1", "h2", "h3"].includes(tag)) {
      flush();
      const runs: Inline[] = [];
      collectInline(el, tag.startsWith("h") ? { bold: true, text: "" } : { text: "" }, runs);
      if (runs.some((r) => r.text.trim())) blocks.push({ kind: "para", runs, align: readAlign(el) });
    } else if (tag === "ul" || tag === "ol") {
      flush();
      const items: Inline[][] = [];
      el.querySelectorAll(":scope > li").forEach((li) => {
        const runs: Inline[] = [];
        collectInline(li, { text: "" }, runs);
        items.push(runs);
      });
      if (items.length) blocks.push({ kind: "list", ordered: tag === "ol", items });
    } else if (tag === "table") {
      flush();
      let head: string[] | null = null;
      const rows: string[][] = [];
      el.querySelectorAll("tr").forEach((tr) => {
        const cells = Array.from(tr.children).map((c) => (c.textContent ?? "").replace(/\s+/g, " ").trim());
        if (cells.length === 0) return;
        const isHead = Array.from(tr.children).some((c) => c.tagName.toLowerCase() === "th");
        if (isHead && head === null) head = cells;
        else rows.push(cells);
      });
      blocks.push({ kind: "table", head, rows });
    } else {
      collectInline(el, { text: "" }, current);
    }
  });
  flush();
  return blocks;
}

function setRunFont(doc: jsPDF, style: Inline, fs: number) {
  doc.setFont(BODY_FONT, style.bold ? "bold" : style.italic ? "italic" : "normal");
  doc.setFontSize(fs);
}

// Word-wrap a sequence of styled runs at the given left edge / width, advancing
// ctx.y. Handles explicit line breaks (\n), bold/underline/strike, sup/sub and
// paragraph alignment (left/center/right/justify).
function drawRuns(ctx: RenderCtx, runs: Inline[], leftX: number, maxWidth: number, fontSize: number, align: Align = "left") {
  const { doc } = ctx;
  const lineHeight = fontSize * 0.5;
  type W = { text: string; style: Inline; w: number; space: boolean };

  // First pass: break the runs into lines so we know each line's width (needed
  // for center/right/justify positioning).
  const lines: { words: W[]; width: number }[] = [];
  let line: W[] = [];
  let lineW = 0;
  const pushLine = () => {
    while (line.length && line[line.length - 1].space) { lineW -= line[line.length - 1].w; line.pop(); }
    lines.push({ words: line, width: lineW });
    line = [];
    lineW = 0;
  };
  for (const run of runs) {
    const segments = run.text.split("\n");
    segments.forEach((seg, si) => {
      if (si > 0) pushLine();
      const tokens = seg.split(/(\s+)/).filter((s) => s.length > 0);
      for (const tk of tokens) {
        const fs = run.sup || run.sub ? fontSize * 0.75 : fontSize;
        setRunFont(doc, run, fs);
        const w = doc.getTextWidth(tk);
        if (/^\s+$/.test(tk)) {
          if (line.length === 0) continue;
          line.push({ text: " ", style: run, w, space: true });
          lineW += w;
          continue;
        }
        if (lineW + w > maxWidth && line.length > 0) pushLine();
        line.push({ text: tk, style: run, w, space: false });
        lineW += w;
      }
    });
  }
  pushLine();

  // Second pass: draw each line with the requested alignment.
  lines.forEach((ln, idx) => {
    ensureSpace(ctx, lineHeight + 1);
    const isLast = idx === lines.length - 1;
    let cx = leftX;
    let extraSpace = 0;
    if (align === "center") cx = leftX + Math.max(0, (maxWidth - ln.width) / 2);
    else if (align === "right") cx = leftX + Math.max(0, maxWidth - ln.width);
    else if (align === "justify" && !isLast) {
      const gaps = ln.words.filter((w) => w.space).length;
      if (gaps > 0) extraSpace = Math.max(0, (maxWidth - ln.width) / gaps);
    }
    for (const word of ln.words) {
      const fs = word.style.sup || word.style.sub ? fontSize * 0.75 : fontSize;
      setRunFont(doc, word.style, fs);
      const yOff = word.style.sup ? -fontSize * 0.30 : word.style.sub ? fontSize * 0.12 : 0;
      doc.text(word.text, cx, ctx.y + yOff);
      if (word.style.underline || word.style.strike) {
        const lineY = ctx.y + yOff + (word.style.strike ? -fontSize * 0.18 : fontSize * 0.14);
        doc.setLineWidth(0.2);
        doc.setDrawColor(40);
        doc.line(cx, lineY, cx + word.w, lineY);
      }
      cx += word.w + (word.space ? extraSpace : 0);
    }
    ctx.y += lineHeight;
  });
}

function drawList(ctx: RenderCtx, list: Extract<RichBlock, { kind: "list" }>, leftX: number, maxWidth: number, fontSize: number) {
  const { doc } = ctx;
  list.items.forEach((runs, idx) => {
    const marker = list.ordered ? `${idx + 1}.` : "•";
    setRunFont(doc, { text: "" }, fontSize);
    const markerW = doc.getTextWidth(marker) + 1.5;
    ensureSpace(ctx, fontSize * 0.5 + 1);
    setRunFont(doc, { text: "" }, fontSize);
    doc.text(marker, leftX, ctx.y);
    drawRuns(ctx, runs.length ? runs : [{ text: "" }], leftX + markerW, maxWidth - markerW, fontSize);
  });
}

function drawTable(ctx: RenderCtx, table: Extract<RichBlock, { kind: "table" }>, leftX: number, fontSize: number) {
  const { doc } = ctx;
  ensureSpace(ctx, 14);
  autoTable(doc, {
    startY: ctx.y,
    margin: { left: leftX, right: MARGIN_X },
    head: table.head ? [table.head] : undefined,
    body: table.rows.length ? table.rows : [[""]],
    theme: "grid",
    tableWidth: "wrap",
    styles: { font: BODY_FONT, fontStyle: "normal", fontSize: Math.max(8, fontSize - 1), cellPadding: 1.6, lineColor: 150, lineWidth: 0.2, textColor: 20, overflow: "linebreak" },
    headStyles: { font: BODY_FONT, fontStyle: "bold", fillColor: [235, 235, 235], textColor: 20, lineColor: 150, lineWidth: 0.2 },
  });
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  ctx.page = doc.getNumberOfPages();
  ctx.y = (finalY ?? ctx.y) + 3;
}

function drawRichContent(ctx: RenderCtx, html: string, leftX: number, maxWidth: number, fontSize: number) {
  if (!isHtml(html)) {
    drawRuns(ctx, [{ text: html }], leftX, maxWidth, fontSize);
    return;
  }
  const blocks = parseRichBlocks(html);
  blocks.forEach((b, i) => {
    if (i > 0) ctx.y += 1;
    if (b.kind === "para") drawRuns(ctx, b.runs, leftX, maxWidth, fontSize, b.align);
    else if (b.kind === "list") drawList(ctx, b, leftX, maxWidth, fontSize);
    else if (b.kind === "table") drawTable(ctx, b, leftX, fontSize);
  });
}

function drawHeader(ctx: RenderCtx, exam: Exam, template: Template | null, logo: { data: string; w: number; h: number } | null, className: string) {
  const { doc } = ctx;
  let y = 18;

  if (logo) {
    const aspect = logo.w / logo.h;
    const h = 22;
    const w = h * aspect;
    doc.addImage(logo.data, imgFormat(logo.data), MARGIN_X, y, w, h);
  }

  const textX = logo ? MARGIN_X + 28 : MARGIN_X;
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text((template?.school_full_name || "Empower Learning System").toUpperCase(), textX, y + 6);
  doc.setFontSize(11);
  doc.setFont("times", "normal");
  doc.text(`${template?.header_title || "Exam"} (${template?.header_year || new Date().getFullYear()})`, textX, y + 13);
  if (template?.motto) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(template.motto, textX, y + 19);
    doc.setTextColor(0);
  }

  ctx.y = y + 28;

  doc.setFontSize(10);
  doc.setFont(BODY_FONT, "normal");
  const row1Y = ctx.y;
  doc.text(`Subject: ${exam.subject}`, MARGIN_X, row1Y);
  if (exam.part) doc.text(`Part: ${exam.part}`, MARGIN_X + 70, row1Y);
  doc.text(`Time: ${exam.time_limit_minutes != null ? formatTime(exam.time_limit_minutes) : "—"}`, MARGIN_X + 120, row1Y);
  doc.text(`Total Marks: ${exam.total_marks}`, MARGIN_X + 160, row1Y);
  ctx.y += 6;
  doc.text("Name: __________________", MARGIN_X, ctx.y);
  doc.text(`Class: ${className || "_______"}`, MARGIN_X + 90, ctx.y);
  doc.text(`Level: ${exam.level || "_______"}`, MARGIN_X + 140, ctx.y);
  ctx.y += 6;
  doc.text("Campus: __________________________", MARGIN_X, ctx.y);
  doc.text("Day & Date: ______________________", MARGIN_X + 90, ctx.y);
  ctx.y += 4;
  doc.setDrawColor(180);
  doc.line(MARGIN_X, ctx.y, PAGE_WIDTH - MARGIN_X, ctx.y);
  ctx.y += 6;
}

function drawInfoBlocks(ctx: RenderCtx, template: Template | null) {
  if (!template) return;
  const { doc } = ctx;
  const writeBlock = (title: string, lines: string[]) => {
    if (lines.length === 0) return;
    ensureSpace(ctx, 10 + lines.length * 4);
    doc.setFont(BODY_FONT, "bold");
    doc.setFontSize(9);
    doc.text(title, MARGIN_X, ctx.y);
    ctx.y += 4;
    doc.setFont(BODY_FONT, "normal");
    doc.setFontSize(9);
    lines.forEach((line) => {
      const wrapped = doc.splitTextToSize("• " + line, PAGE_WIDTH - 2 * MARGIN_X) as string[];
      ensureSpace(ctx, wrapped.length * 4);
      doc.text(wrapped, MARGIN_X, ctx.y);
      ctx.y += wrapped.length * 4;
    });
    ctx.y += 2;
  };
  writeBlock("INSTRUCTIONS", template.instructions);
  writeBlock("INFORMATION", template.information);
  if (template.final_reminder) {
    ensureSpace(ctx, 10);
    doc.setFont(BODY_FONT, "italic");
    doc.setFontSize(9);
    const wrapped = doc.splitTextToSize("FINAL REMINDER: " + template.final_reminder, PAGE_WIDTH - 2 * MARGIN_X) as string[];
    doc.text(wrapped, MARGIN_X, ctx.y);
    ctx.y += wrapped.length * 4 + 2;
  }
}

function drawQuestion(ctx: RenderCtx, q: Question, i: number, imgs: Record<string, { data: string; w: number; h: number } | null>) {
  const { doc } = ctx;
  ensureSpace(ctx, 16);
  const num = `${i + 1}.`;
  const indent = MARGIN_X + 7;
  const startY = ctx.y;

  doc.setFont(BODY_FONT, "bold");
  doc.setFontSize(10);
  doc.text(num, MARGIN_X, startY);
  doc.text(`[${q.points}]`, PAGE_WIDTH - MARGIN_X - 2, startY, { align: "right" });
  doc.setFont(BODY_FONT, "normal");

  // Question text: rich HTML (bold/lists/tables/…) or plain text, rendered so
  // the printed paper matches the on-screen exam.
  drawRichContent(ctx, q.text, indent, PAGE_WIDTH - indent - MARGIN_X - 10, 10);
  if (ctx.y <= startY) ctx.y = startY + 5; // empty text: still clear the number row

  // Question images — stacked vertically (matching the on-screen layout), each
  // sized to its chosen width (% of the content column) so it isn't tiny.
  const contentW = PAGE_WIDTH - indent - MARGIN_X;
  const imgList = questionImages(q)
    .map((qi) => ({ img: imgs[qi.url], width: qi.width }))
    .filter((x) => x.img) as { img: { data: string; w: number; h: number }; width?: number }[];
  if (imgList.length) {
    ctx.y += 1;
    for (const { img, width } of imgList) {
      const aspect = img.w / img.h;
      let w: number;
      let h: number;
      if (width) {
        w = (Math.min(100, Math.max(10, width)) / 100) * contentW;
        h = w / aspect;
        const maxH = 220;
        if (h > maxH) { h = maxH; w = h * aspect; }
      } else {
        // No explicit width (legacy images): render at a generous default size.
        const maxW = contentW * 0.85;
        const maxH = 95;
        w = Math.min(maxW, aspect * maxH);
        h = w / aspect;
        if (h > maxH) { h = maxH; w = h * aspect; }
      }
      ensureSpace(ctx, h + 4);
      doc.addImage(img.data, imgFormat(img.data), indent, ctx.y, w, h);
      ctx.y += h + 3;
    }
  }

  // Rich-text rendering may leave the font bold/italic — reset before drawing
  // options, answer prompts and lines.
  doc.setFont(BODY_FONT, "normal");
  doc.setFontSize(10);

  const drawAnswerLines = (count: number) => {
    for (let l = 0; l < count; l++) {
      ensureSpace(ctx, 7);
      doc.setDrawColor(200);
      doc.line(indent, ctx.y + 4, PAGE_WIDTH - MARGIN_X, ctx.y + 4);
      ctx.y += 7;
    }
  };

  const defaultLinesFor = (type: Question["type"]) => {
    if (type === "short") return 3;
    if (type === "long") return 8;
    return 0;
  };
  const requestedLines = q.lines_for_pdf ?? defaultLinesFor(q.type);

  if (q.type === "mcq") {
    doc.setFontSize(10);
    q.options.forEach((opt, j) => {
      const line = `${String.fromCharCode(65 + j)}) ${opt}`;
      const wrappedOpt = doc.splitTextToSize(line, PAGE_WIDTH - indent - MARGIN_X - 6) as string[];
      ensureSpace(ctx, wrappedOpt.length * 5);
      doc.text(wrappedOpt, indent + 4, ctx.y);
      ctx.y += wrappedOpt.length * 5;
    });
    if (requestedLines > 0) {
      ctx.y += 2;
      drawAnswerLines(requestedLines);
    }
  } else if (q.type === "truefalse") {
    doc.text("True  /  False", indent + 4, ctx.y);
    ctx.y += 6;
    if (requestedLines > 0) drawAnswerLines(requestedLines);
  } else if (q.type === "fillblank") {
    if (requestedLines > 0) {
      drawAnswerLines(requestedLines);
    } else {
      doc.text("Answer: __________________________", indent, ctx.y);
      ctx.y += 6;
    }
  } else {
    drawAnswerLines(requestedLines);
  }
  ctx.y += 3;
}

function drawFooter(doc: jsPDF, total: number, schoolName: string) {
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont(BODY_FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(schoolName, MARGIN_X, FOOTER_Y);
    doc.text(`Page ${p} of ${total}`, PAGE_WIDTH - MARGIN_X, FOOTER_Y, { align: "right" });
    doc.setTextColor(0);
  }
}

function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}:00 hr` : `${h}:${String(m).padStart(2, "0")} hr`;
}

export async function generateExamPdf(exam: Exam, template: Template | null, className = ""): Promise<Blob> {
  // compress keeps the embedded Unicode font from bloating the output.
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  registerFonts(doc, await loadFontData());
  doc.setFont(BODY_FONT, "normal");

  const allImages = [
    ...(template?.logo_url ? [template.logo_url] : []),
    ...(exam.reference_images || []),
    ...exam.questions.flatMap((q) => questionImages(q).map((img) => img.url)),
  ];
  const imgMap: Record<string, { data: string; w: number; h: number } | null> = {};
  await Promise.all(allImages.map(async (url) => { imgMap[url] = await fetchImage(url); }));

  const logo = template?.logo_url ? imgMap[template.logo_url] : null;
  const ctx: RenderCtx = { doc, y: 20, page: 1 };

  drawHeader(ctx, exam, template, logo, className);
  drawInfoBlocks(ctx, template);

  if (exam.reference_images.length > 0) {
    ctx.doc.addPage();
    ctx.page += 1;
    ctx.y = 20;
    doc.setFont(BODY_FONT, "bold");
    doc.setFontSize(12);
    doc.text("Reference Material", MARGIN_X, ctx.y);
    ctx.y += 8;
    for (const url of exam.reference_images) {
      const img = imgMap[url];
      if (!img) continue;
      const maxW = PAGE_WIDTH - 2 * MARGIN_X;
      const maxH = 120;
      const aspect = img.w / img.h;
      let w = Math.min(maxW, aspect * maxH);
      let h = w / aspect;
      if (h > maxH) { h = maxH; w = h * aspect; }
      ensureSpace(ctx, h + 6);
      doc.addImage(img.data, imgFormat(img.data), MARGIN_X, ctx.y, w, h);
      ctx.y += h + 6;
    }
  }

  if (exam.questions.length > 0) {
    doc.addPage();
    ctx.page += 1;
    ctx.y = 20;
  }

  exam.questions.forEach((q, i) => drawQuestion(ctx, q, i, imgMap));

  drawFooter(doc, doc.getNumberOfPages(), template?.school_name || "ELS");

  return doc.output("blob");
}

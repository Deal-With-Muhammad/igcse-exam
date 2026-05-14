import { jsPDF } from "jspdf";
import type { Exam, Question, Template } from "@/types";

const MARGIN_X = 18;
const PAGE_HEIGHT = 297;
const PAGE_WIDTH = 210;
const FOOTER_Y = PAGE_HEIGHT - 12;

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

function drawHeader(ctx: RenderCtx, exam: Exam, template: Template | null, logo: { data: string; w: number; h: number } | null) {
  const { doc } = ctx;
  let y = 18;

  if (logo) {
    const aspect = logo.w / logo.h;
    const h = 22;
    const w = h * aspect;
    doc.addImage(logo.data, "PNG", MARGIN_X, y, w, h);
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
  doc.setFont("helvetica", "normal");
  const row1Y = ctx.y;
  doc.text(`Subject: ${exam.subject}`, MARGIN_X, row1Y);
  if (exam.part) doc.text(`Part: ${exam.part}`, MARGIN_X + 70, row1Y);
  doc.text(`Time: ${formatTime(exam.time_limit_minutes)}`, MARGIN_X + 120, row1Y);
  doc.text(`Total Marks: ${exam.total_marks}`, MARGIN_X + 160, row1Y);
  ctx.y += 6;
  doc.text("Name: ____________________________", MARGIN_X, ctx.y);
  doc.text(`Class: ${exam.level || "_______"}`, MARGIN_X + 120, ctx.y);
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
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, MARGIN_X, ctx.y);
    ctx.y += 4;
    doc.setFont("helvetica", "normal");
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
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    const wrapped = doc.splitTextToSize("FINAL REMINDER: " + template.final_reminder, PAGE_WIDTH - 2 * MARGIN_X) as string[];
    doc.text(wrapped, MARGIN_X, ctx.y);
    ctx.y += wrapped.length * 4 + 2;
  }
}

function drawQuestion(ctx: RenderCtx, q: Question, i: number, imgs: Record<string, { data: string; w: number; h: number } | null>) {
  const { doc } = ctx;
  ensureSpace(ctx, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const num = `${i + 1}.`;
  doc.text(num, MARGIN_X, ctx.y);
  doc.setFont("helvetica", "normal");
  const indent = MARGIN_X + 7;
  const wrapped = doc.splitTextToSize(q.text, PAGE_WIDTH - indent - MARGIN_X - 8) as string[];
  doc.text(wrapped, indent, ctx.y);
  doc.setFont("helvetica", "bold");
  doc.text(`[${q.points}]`, PAGE_WIDTH - MARGIN_X - 2, ctx.y, { align: "right" });
  doc.setFont("helvetica", "normal");
  ctx.y += wrapped.length * 5;

  if (q.image_url && imgs[q.image_url]) {
    const img = imgs[q.image_url]!;
    const maxW = 70;
    const maxH = 50;
    const aspect = img.w / img.h;
    let w = Math.min(maxW, aspect * maxH);
    let h = w / aspect;
    if (h > maxH) { h = maxH; w = h * aspect; }
    ensureSpace(ctx, h + 4);
    doc.addImage(img.data, "PNG", indent, ctx.y, w, h);
    ctx.y += h + 3;
  }

  if (q.type === "mcq") {
    doc.setFontSize(10);
    q.options.forEach((opt, j) => {
      const line = `${String.fromCharCode(65 + j)}) ${opt}`;
      const wrappedOpt = doc.splitTextToSize(line, PAGE_WIDTH - indent - MARGIN_X - 6) as string[];
      ensureSpace(ctx, wrappedOpt.length * 5);
      doc.text(wrappedOpt, indent + 4, ctx.y);
      ctx.y += wrappedOpt.length * 5;
    });
  } else if (q.type === "truefalse") {
    doc.text("True  /  False", indent + 4, ctx.y);
    ctx.y += 6;
  } else if (q.type === "fillblank") {
    doc.text("Answer: __________________________", indent, ctx.y);
    ctx.y += 6;
  } else {
    const lines = q.type === "short" ? 3 : 8;
    for (let l = 0; l < lines; l++) {
      ensureSpace(ctx, 7);
      doc.setDrawColor(200);
      doc.line(indent, ctx.y + 4, PAGE_WIDTH - MARGIN_X, ctx.y + 4);
      ctx.y += 7;
    }
  }
  ctx.y += 3;
}

function drawFooter(doc: jsPDF, total: number, schoolName: string) {
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
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

export async function generateExamPdf(exam: Exam, template: Template | null): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const allImages = [
    ...(template?.logo_url ? [template.logo_url] : []),
    ...(exam.reference_images || []),
    ...exam.questions.map((q) => q.image_url).filter((x): x is string => !!x),
  ];
  const imgMap: Record<string, { data: string; w: number; h: number } | null> = {};
  await Promise.all(allImages.map(async (url) => { imgMap[url] = await fetchImage(url); }));

  const logo = template?.logo_url ? imgMap[template.logo_url] : null;
  const ctx: RenderCtx = { doc, y: 20, page: 1 };

  drawHeader(ctx, exam, template, logo);
  drawInfoBlocks(ctx, template);

  if (exam.reference_images.length > 0) {
    ctx.doc.addPage();
    ctx.page += 1;
    ctx.y = 20;
    doc.setFont("helvetica", "bold");
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
      doc.addImage(img.data, "PNG", MARGIN_X, ctx.y, w, h);
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

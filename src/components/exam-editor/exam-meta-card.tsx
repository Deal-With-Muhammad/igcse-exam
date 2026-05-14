"use client";

import { Card, CardBody, CardHeader, Divider, Input, Select, SelectItem, Textarea, Autocomplete, AutocompleteItem } from "@heroui/react";
import { CURRICULA, SUBJECTS, LEVELS } from "@/lib/constants";
import type { Curriculum, Template } from "@/types";
import { MultiImageUploader } from "./image-uploader";

export interface ExamMeta {
  title: string;
  description: string;
  curriculum: Curriculum;
  subject: string;
  level: string;
  part: string;
  time_limit_minutes: number;
  template_id: string | null;
  reference_images: string[];
}

interface Props {
  meta: ExamMeta;
  onChange: (m: ExamMeta) => void;
  templates: Template[];
}

export function ExamMetaCard({ meta, onChange, templates }: Props) {
  const set = <K extends keyof ExamMeta>(k: K, v: ExamMeta[K]) => onChange({ ...meta, [k]: v });

  return (
    <Card>
      <CardHeader><h2 className="font-semibold">Exam Details</h2></CardHeader>
      <Divider />
      <CardBody className="space-y-4">
        <Input label="Exam title" value={meta.title} onChange={(e) => set("title", e.target.value)} isRequired placeholder="e.g. Tri-Review ICT Level-3" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select label="Curriculum" selectedKeys={[meta.curriculum]} onChange={(e) => set("curriculum", (e.target.value || "igcse") as Curriculum)} isRequired>
            {CURRICULA.map((c) => <SelectItem key={c.value}>{c.label}</SelectItem>)}
          </Select>
          <Autocomplete label="Subject" selectedKey={meta.subject} onSelectionChange={(k) => set("subject", String(k ?? ""))} onInputChange={(v) => set("subject", v)} allowsCustomValue isRequired>
            {SUBJECTS.map((s) => <AutocompleteItem key={s}>{s}</AutocompleteItem>)}
          </Autocomplete>
          <Autocomplete label="Level / Year" selectedKey={meta.level} onSelectionChange={(k) => set("level", String(k ?? ""))} onInputChange={(v) => set("level", v)} allowsCustomValue>
            {LEVELS.map((l) => <AutocompleteItem key={l}>{l}</AutocompleteItem>)}
          </Autocomplete>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input label="Part / Paper" value={meta.part} onChange={(e) => set("part", e.target.value)} placeholder="e.g. Part 1" />
          <Input type="number" label="Time limit (min)" min={1} value={String(meta.time_limit_minutes)} onChange={(e) => set("time_limit_minutes", Math.max(1, Number.parseInt(e.target.value) || 60))} />
          <Select label="PDF Template" selectedKeys={meta.template_id ? [meta.template_id] : []} onChange={(e) => set("template_id", e.target.value || null)}>
            {templates.map((t) => <SelectItem key={t.id}>{t.name}{t.is_default ? " (default)" : ""}</SelectItem>)}
          </Select>
        </div>

        <Textarea label="Description / Instructions for students (optional)" value={meta.description} onChange={(e) => set("description", e.target.value)} minRows={2} />

        <div>
          <p className="text-sm font-medium mb-2">Reference images (shown to students at start)</p>
          <MultiImageUploader value={meta.reference_images} onChange={(arr) => set("reference_images", arr)} />
        </div>
      </CardBody>
    </Card>
  );
}

"use client";

import { Card, CardBody, CardHeader, Divider, Input, Select, SelectItem, Autocomplete, AutocompleteItem } from "@heroui/react";
import { CURRICULA, SUBJECTS } from "@/lib/constants";
import type { Class, Curriculum, Template } from "@/types";
import { MultiImageUploader } from "./image-uploader";

export interface ExamMeta {
  title: string;
  curriculum: Curriculum;
  subject: string;
  level: string;
  part: string;
  template_id: string | null;
  class_id: string | null;
  reference_images: string[];
}

interface Props {
  meta: ExamMeta;
  onChange: (m: ExamMeta) => void;
  templates: Template[];
  classes: Class[];
  lockClass?: boolean;
}

export function ExamMetaCard({ meta, onChange, templates, classes, lockClass }: Props) {
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
          <Select
            label="Class"
            selectedKeys={meta.class_id ? [meta.class_id] : []}
            onChange={(e) => set("class_id", e.target.value || null)}
            isDisabled={lockClass}
            description={lockClass ? "Pinned to your assigned class" : ""}
          >
            {classes.map((c) => <SelectItem key={c.id}>{c.name}</SelectItem>)}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input label="Part / Paper" value={meta.part} onChange={(e) => set("part", e.target.value)} placeholder="e.g. Part 1" />
          <Input label="Level / Year (free text)" value={meta.level} onChange={(e) => set("level", e.target.value)} placeholder="e.g. Year 10" description="Shown on the PDF" />
          <Select label="PDF Template" selectedKeys={meta.template_id ? [meta.template_id] : []} onChange={(e) => set("template_id", e.target.value || null)}>
            {templates.map((t) => <SelectItem key={t.id}>{t.name}{t.is_default ? " (default)" : ""}</SelectItem>)}
          </Select>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Reference images (shown to students at start)</p>
          <MultiImageUploader value={meta.reference_images} onChange={(arr) => set("reference_images", arr)} />
        </div>
      </CardBody>
    </Card>
  );
}

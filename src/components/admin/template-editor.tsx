"use client";

import { Button, Card, CardBody, CardHeader, Divider, Input, Switch, Textarea } from "@heroui/react";
import { ArrowLeft, Save, ImagePlus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Template } from "@/types";

const emptyTemplate = (): Template => ({
  id: "",
  name: "",
  school_name: "ELS",
  school_full_name: "Empower Learning System",
  logo_url: null,
  motto: "HUMANITY FIRST",
  header_title: "Tri-Review",
  header_year: String(new Date().getFullYear()),
  instructions: [],
  information: [],
  final_reminder: "Stay focused, watch the time, and submit before time runs out.",
  is_default: false,
  created_by: null,
  created_at: "",
  updated_at: "",
});

interface Props {
  mode: "create" | "edit";
  initial?: Template;
}

export function TemplateEditor({ mode, initial }: Props) {
  const router = useRouter();
  const [t, setT] = useState<Template>(initial || emptyTemplate());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const update = <K extends keyof Template>(k: K, v: Template[K]) => setT((cur) => ({ ...cur, [k]: v }));
  const addLine = (k: "instructions" | "information") => update(k, [...(t[k] || []), ""]);
  const setLine = (k: "instructions" | "information", i: number, v: string) => {
    const arr = [...(t[k] || [])]; arr[i] = v; update(k, arr);
  };
  const delLine = (k: "instructions" | "information", i: number) => {
    const arr = [...(t[k] || [])]; arr.splice(i, 1); update(k, arr);
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `logos/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("template-assets").upload(path, file, { upsert: true });
      if (error) { toast.error(error.message); return; }
      const { data } = supabase.storage.from("template-assets").getPublicUrl(path);
      update("logo_url", data.publicUrl);
      toast.success("Logo uploaded");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!t.name.trim()) { toast.error("Template name is required"); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        name: t.name,
        school_name: t.school_name,
        school_full_name: t.school_full_name,
        logo_url: t.logo_url,
        motto: t.motto,
        header_title: t.header_title,
        header_year: t.header_year,
        instructions: t.instructions.filter((s) => s.trim()),
        information: t.information.filter((s) => s.trim()),
        final_reminder: t.final_reminder,
        is_default: t.is_default,
      };
      if (mode === "create") {
        const { error } = await supabase.from("templates").insert(payload);
        if (error) { toast.error(error.message); return; }
      } else {
        const { error } = await supabase.from("templates").update(payload).eq("id", t.id);
        if (error) { toast.error(error.message); return; }
      }
      toast.success("Template saved");
      router.push("/admin/templates");
      router.refresh();
    } finally { setSaving(false); }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/templates">
          <Button isIconOnly variant="light"><ArrowLeft size={20} /></Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">{mode === "create" ? "New Template" : "Edit Template"}</h1>
      </div>

      <Card className="mb-4">
        <CardHeader><h2 className="font-semibold">Header</h2></CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          <Input label="Template name (internal)" value={t.name} onChange={(e) => update("name", e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="School short name" value={t.school_name} onChange={(e) => update("school_name", e.target.value)} />
            <Input label="School full name" value={t.school_full_name} onChange={(e) => update("school_full_name", e.target.value)} />
            <Input label="Header title" value={t.header_title} onChange={(e) => update("header_title", e.target.value)} description="e.g. Tri-Review, Final Exam" />
            <Input label="Year" value={t.header_year} onChange={(e) => update("header_year", e.target.value)} />
            <Input label="Motto" value={t.motto} onChange={(e) => update("motto", e.target.value)} className="md:col-span-2" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Logo</p>
              {t.logo_url && (
                <div className="flex items-center gap-2">
                  <Image src={t.logo_url} alt="logo" width={64} height={64} className="rounded border border-default-200" unoptimized />
                  <Button size="sm" variant="light" color="danger" onPress={() => update("logo_url", null)} startContent={<Trash2 size={14} />}>Remove</Button>
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              <Button as="span" variant="flat" startContent={<ImagePlus size={16} />} isLoading={uploading}>Upload</Button>
            </label>
          </div>

          <Switch isSelected={t.is_default} onValueChange={(v) => update("is_default", v)}>
            Use as default template for new exams
          </Switch>
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardHeader className="flex justify-between"><h2 className="font-semibold">Instructions</h2>
          <Button size="sm" variant="flat" onPress={() => addLine("instructions")}>Add line</Button>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-2">
          {t.instructions.map((line, i) => (
            <div key={i} className="flex gap-2">
              <Input value={line} onChange={(e) => setLine("instructions", i, e.target.value)} className="flex-1" />
              <Button isIconOnly variant="light" color="danger" onPress={() => delLine("instructions", i)}><Trash2 size={16} /></Button>
            </div>
          ))}
          {t.instructions.length === 0 && <p className="text-sm text-default-500">No instructions yet</p>}
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardHeader className="flex justify-between"><h2 className="font-semibold">Information</h2>
          <Button size="sm" variant="flat" onPress={() => addLine("information")}>Add line</Button>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-2">
          {t.information.map((line, i) => (
            <div key={i} className="flex gap-2">
              <Input value={line} onChange={(e) => setLine("information", i, e.target.value)} className="flex-1" />
              <Button isIconOnly variant="light" color="danger" onPress={() => delLine("information", i)}><Trash2 size={16} /></Button>
            </div>
          ))}
          {t.information.length === 0 && <p className="text-sm text-default-500">No information yet</p>}
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardHeader><h2 className="font-semibold">Final reminder</h2></CardHeader>
        <Divider />
        <CardBody>
          <Textarea value={t.final_reminder} onChange={(e) => update("final_reminder", e.target.value)} minRows={2} />
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="light" onPress={() => router.back()}>Cancel</Button>
        <Button color="primary" onPress={save} isLoading={saving} startContent={<Save size={16} />}>Save Template</Button>
      </div>
    </div>
  );
}

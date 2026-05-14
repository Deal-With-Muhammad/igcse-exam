"use client";

import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { Plus, Star, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Template } from "@/types";

export function TemplatesClient({ templates: initial }: { templates: Template[] }) {
  const [templates, setTemplates] = useState(initial);

  const setDefault = async (id: string) => {
    const supabase = createClient();
    await supabase.from("templates").update({ is_default: false }).neq("id", id);
    const { error } = await supabase.from("templates").update({ is_default: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setTemplates((arr) => arr.map((t) => ({ ...t, is_default: t.id === id })));
    toast.success("Default template updated");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("templates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setTemplates((arr) => arr.filter((t) => t.id !== id));
    toast.success("Template deleted");
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Exam Templates</h1>
          <p className="text-default-500 text-sm">Templates control the look of exported exam papers</p>
        </div>
        <Link href="/admin/templates/new">
          <Button color="primary" startContent={<Plus size={16} />}>New Template</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader className="flex-col items-start gap-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{t.name}</h3>
                {t.is_default && <Chip size="sm" color="warning" variant="flat" startContent={<Star size={12} />}>Default</Chip>}
              </div>
              <p className="text-xs text-default-500">{t.school_full_name}</p>
            </CardHeader>
            <CardBody className="text-sm space-y-2">
              <p><span className="text-default-500">Title:</span> {t.header_title} ({t.header_year})</p>
              <p><span className="text-default-500">Motto:</span> {t.motto || "—"}</p>
              <p><span className="text-default-500">Instructions:</span> {t.instructions?.length || 0} items</p>
              <div className="flex gap-2 pt-2 border-t border-default-100">
                <Link href={`/admin/templates/${t.id}`}>
                  <Button size="sm" variant="flat" startContent={<Edit size={14} />}>Edit</Button>
                </Link>
                {!t.is_default && (
                  <Button size="sm" variant="flat" color="warning" startContent={<Star size={14} />} onPress={() => setDefault(t.id)}>
                    Set default
                  </Button>
                )}
                <Button size="sm" variant="light" color="danger" isIconOnly onPress={() => remove(t.id)}><Trash2 size={14} /></Button>
              </div>
            </CardBody>
          </Card>
        ))}
        {templates.length === 0 && (
          <Card className="col-span-full text-center p-6"><CardBody><p className="text-default-500">No templates yet — create one</p></CardBody></Card>
        )}
      </div>
    </div>
  );
}

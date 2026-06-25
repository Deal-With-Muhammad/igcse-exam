"use client";

import { Button, Card, CardBody, CardHeader, Divider, Input, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Pencil, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Subject } from "@/types";

export function SubjectsClient({ subjects: initial }: { subjects: Subject[] }) {
  const [subjects, setSubjects] = useState(initial);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const supabase = createClient();
    const sort = subjects.length === 0 ? 10 : subjects[subjects.length - 1].sort_order + 10;
    const { data, error } = await supabase
      .from("subjects")
      .insert({ name: newName.trim(), sort_order: sort })
      .select("*")
      .single();
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    setSubjects((arr) => [...arr, data as Subject]);
    setNewName("");
    toast.success("Subject added");
  };

  const startEdit = (s: Subject) => { setEditingId(s.id); setEditValue(s.name); };

  const commitEdit = async (s: Subject) => {
    const newValue = editValue.trim();
    setEditingId(null);
    if (!newValue || newValue === s.name) return;
    const supabase = createClient();
    const { error } = await supabase.from("subjects").update({ name: newValue }).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    setSubjects((arr) => arr.map((x) => (x.id === s.id ? { ...x, name: newValue } : x)));
    toast.success("Renamed");
  };

  const remove = async (s: Subject) => {
    if (!confirm(`Delete subject "${s.name}"? Teachers attached to it will be unlinked.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("subjects").delete().eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    setSubjects((arr) => arr.filter((x) => x.id !== s.id));
    toast.success("Subject deleted");
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= subjects.length) return;
    const a = subjects[i]; const b = subjects[j];
    const supabase = createClient();
    await supabase.from("subjects").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("subjects").update({ sort_order: a.sort_order }).eq("id", b.id);
    const arr = [...subjects];
    [arr[i], arr[j]] = [{ ...arr[j], sort_order: a.sort_order }, { ...arr[i], sort_order: b.sort_order }];
    setSubjects(arr);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Subjects</h1>
        <p className="text-default-500 text-sm">Manage subjects used across exams and teacher assignments</p>
      </div>

      <Card className="mb-4">
        <CardHeader><h2 className="font-semibold">Add a subject</h2></CardHeader>
        <Divider />
        <CardBody className="flex flex-row gap-2 items-end">
          <Input label="Subject name" placeholder="e.g. Mathematics" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="flex-1" />
          <Button color="primary" startContent={<Plus size={16} />} onPress={add} isLoading={adding}>Add</Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Table aria-label="Subjects" removeWrapper>
            <TableHeader>
              <TableColumn>ORDER</TableColumn>
              <TableColumn>NAME</TableColumn>
              <TableColumn className="w-48">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No subjects yet">
              {subjects.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell><span className="text-xs text-default-500">{s.sort_order}</span></TableCell>
                  <TableCell>
                    {editingId === s.id ? (
                      <Input
                        size="sm"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit(s);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <button onClick={() => startEdit(s)} className="text-left font-medium hover:underline">{s.name}</button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {editingId === s.id ? (
                        <>
                          <Button isIconOnly size="sm" variant="flat" color="primary" onPress={() => commitEdit(s)} aria-label="Save"><Save size={14} /></Button>
                          <Button isIconOnly size="sm" variant="light" onPress={() => setEditingId(null)} aria-label="Cancel"><X size={14} /></Button>
                        </>
                      ) : (
                        <>
                          <Button isIconOnly size="sm" variant="light" onPress={() => move(i, -1)} isDisabled={i === 0} aria-label="Move up"><ArrowUp size={14} /></Button>
                          <Button isIconOnly size="sm" variant="light" onPress={() => move(i, 1)} isDisabled={i === subjects.length - 1} aria-label="Move down"><ArrowDown size={14} /></Button>
                          <Button isIconOnly size="sm" variant="flat" onPress={() => startEdit(s)} aria-label="Edit"><Pencil size={14} /></Button>
                          <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => remove(s)} aria-label="Delete"><Trash2 size={14} /></Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}

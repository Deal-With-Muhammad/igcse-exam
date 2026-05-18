"use client";

import { Button, Card, CardBody, CardHeader, Divider, Input, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Class } from "@/types";

export function ClassesClient({ classes: initial }: { classes: Class[] }) {
  const [classes, setClasses] = useState(initial);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const supabase = createClient();
    const sort = classes.length === 0 ? 10 : classes[classes.length - 1].sort_order + 10;
    const { data, error } = await supabase
      .from("classes")
      .insert({ name: newName.trim(), sort_order: sort })
      .select("*")
      .single();
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    setClasses((arr) => [...arr, data as Class]);
    setNewName("");
    toast.success("Class added");
  };

  const rename = async (c: Class, newValue: string) => {
    if (!newValue.trim() || newValue === c.name) return;
    const supabase = createClient();
    const { error } = await supabase.from("classes").update({ name: newValue }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    setClasses((arr) => arr.map((x) => (x.id === c.id ? { ...x, name: newValue } : x)));
    toast.success("Renamed");
  };

  const remove = async (c: Class) => {
    if (!confirm(`Delete class "${c.name}"? Teachers and exams attached to it will be unlinked.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("classes").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    setClasses((arr) => arr.filter((x) => x.id !== c.id));
    toast.success("Class deleted");
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= classes.length) return;
    const a = classes[i]; const b = classes[j];
    const supabase = createClient();
    await supabase.from("classes").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("classes").update({ sort_order: a.sort_order }).eq("id", b.id);
    const arr = [...classes];
    [arr[i], arr[j]] = [{ ...arr[j], sort_order: a.sort_order }, { ...arr[i], sort_order: b.sort_order }];
    setClasses(arr);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Classes</h1>
        <p className="text-default-500 text-sm">Manage class names used across exams and teacher assignments</p>
      </div>

      <Card className="mb-4">
        <CardHeader><h2 className="font-semibold">Add a class</h2></CardHeader>
        <Divider />
        <CardBody className="flex flex-row gap-2 items-end">
          <Input label="Class name" placeholder="e.g. Level-9" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="flex-1" />
          <Button color="primary" startContent={<Plus size={16} />} onPress={add} isLoading={adding}>Add</Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Table aria-label="Classes" removeWrapper>
            <TableHeader>
              <TableColumn>ORDER</TableColumn>
              <TableColumn>NAME</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No classes yet">
              {classes.map((c, i) => (
                <ClassRow key={c.id} cls={c} index={i} total={classes.length} onRename={rename} onMove={move} onRemove={remove} />
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}

function ClassRow({ cls, index, total, onRename, onMove, onRemove }: { cls: Class; index: number; total: number; onRename: (c: Class, v: string) => void; onMove: (i: number, d: -1 | 1) => void; onRemove: (c: Class) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(cls.name);
  const commit = () => { setEditing(false); if (val !== cls.name) onRename(cls, val); };
  return (
    <TableRow>
      <TableCell><span className="text-xs text-default-500">{cls.sort_order}</span></TableCell>
      <TableCell>
        {editing ? (
          <Input size="sm" value={val} onChange={(e) => setVal(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} autoFocus />
        ) : (
          <button onClick={() => setEditing(true)} className="text-left font-medium hover:underline">{cls.name}</button>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button isIconOnly size="sm" variant="light" onPress={() => onMove(index, -1)} isDisabled={index === 0}><ArrowUp size={14} /></Button>
          <Button isIconOnly size="sm" variant="light" onPress={() => onMove(index, 1)} isDisabled={index === total - 1}><ArrowDown size={14} /></Button>
          {editing ? (
            <Button isIconOnly size="sm" variant="flat" color="primary" onPress={commit}><Save size={14} /></Button>
          ) : null}
          <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => onRemove(cls)}><Trash2 size={14} /></Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

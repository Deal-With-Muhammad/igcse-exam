"use client";

import { Button, Card, CardBody, Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, useDisclosure } from "@heroui/react";
import { Plus, ShieldCheck, GraduationCap, Trash2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import type { Class, Profile, Subject, TeacherClass, TeacherSubject } from "@/types";
import { TeacherCreateModal } from "./teacher-create-modal";
import { TeacherEditModal } from "./teacher-edit-modal";
import { TeacherDeleteModal } from "./teacher-delete-modal";
import { createClient } from "@/lib/supabase/client";

export function TeachersClient({ profiles: initial }: { profiles: Profile[] }) {
  const [profiles, setProfiles] = useState(initial);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  // teacher id -> the class / subject ids they're assigned to
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [subjectAssignments, setSubjectAssignments] = useState<Record<string, string[]>>({});
  const create = useDisclosure();
  const edit = useDisclosure();
  const del = useDisclosure();
  const [toEdit, setToEdit] = useState<Profile | null>(null);
  const [toDelete, setToDelete] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("classes").select("*").order("sort_order").then(({ data }) => {
      setClasses((data ?? []) as Class[]);
    });
    supabase.from("subjects").select("*").order("sort_order").then(({ data }) => {
      setSubjects((data ?? []) as Subject[]);
    });
    supabase.from("teacher_classes").select("teacher_id, class_id").then(({ data }) => {
      const map: Record<string, string[]> = {};
      for (const row of (data ?? []) as TeacherClass[]) {
        (map[row.teacher_id] ??= []).push(row.class_id);
      }
      setAssignments(map);
    });
    supabase.from("teacher_subjects").select("teacher_id, subject_id").then(({ data }) => {
      const map: Record<string, string[]> = {};
      for (const row of (data ?? []) as TeacherSubject[]) {
        (map[row.teacher_id] ??= []).push(row.subject_id);
      }
      setSubjectAssignments(map);
    });
  }, []);

  const classNameById = (id: string) => classes.find((c) => c.id === id)?.name ?? id;
  const subjectNameById = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;

  const onCreated = (p: Profile, classIds: string[], subjectIds: string[]) => {
    setProfiles((arr) => [p, ...arr]);
    setAssignments((m) => ({ ...m, [p.id]: classIds }));
    setSubjectAssignments((m) => ({ ...m, [p.id]: subjectIds }));
  };
  const onUpdated = (p: Profile, classIds: string[], subjectIds: string[]) => {
    setProfiles((arr) => arr.map((x) => (x.id === p.id ? p : x)));
    setAssignments((m) => ({ ...m, [p.id]: classIds }));
    setSubjectAssignments((m) => ({ ...m, [p.id]: subjectIds }));
  };
  const onDeleted = (id: string) => {
    setProfiles((arr) => arr.filter((p) => p.id !== id));
    setAssignments((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
    setSubjectAssignments((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
  };

  const renderClasses = (p: Profile) => {
    if (p.role === "admin") return <span className="text-sm text-default-500">All classes</span>;
    const ids = assignments[p.id] ?? [];
    if (ids.length === 0) return <span className="text-sm text-default-400">All (no class set)</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {ids.map((id) => (
          <Chip key={id} size="sm" variant="flat">{classNameById(id)}</Chip>
        ))}
      </div>
    );
  };

  const renderSubjects = (p: Profile) => {
    if (p.role === "admin") return <span className="text-sm text-default-500">All</span>;
    const ids = subjectAssignments[p.id] ?? [];
    if (ids.length === 0) return <span className="text-sm text-default-400">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {ids.map((id) => (
          <Chip key={id} size="sm" variant="flat" color="secondary">{subjectNameById(id)}</Chip>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Teachers & Admins</h1>
          <p className="text-default-500 text-sm">Manage accounts, roles, and class assignments</p>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={create.onOpen}>
          Add Teacher
        </Button>
      </div>

      <Card>
        <CardBody>
          <Table aria-label="Teachers" removeWrapper>
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>CLASSES</TableColumn>
              <TableColumn>SUBJECTS</TableColumn>
              <TableColumn>JOINED</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No accounts yet">
              {profiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>
                    <Chip color={p.role === "admin" ? "secondary" : "primary"} variant="flat" size="sm" startContent={p.role === "admin" ? <ShieldCheck size={12} /> : <GraduationCap size={12} />}>
                      {p.role}
                    </Chip>
                  </TableCell>
                  <TableCell>{renderClasses(p)}</TableCell>
                  <TableCell>{renderSubjects(p)}</TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button isIconOnly size="sm" variant="light" onPress={() => { setToEdit(p); edit.onOpen(); }}>
                        <Pencil size={16} />
                      </Button>
                      <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => { setToDelete(p); del.onOpen(); }}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <TeacherCreateModal isOpen={create.isOpen} onClose={create.onClose} onCreated={onCreated} />
      <TeacherEditModal
        isOpen={edit.isOpen}
        onClose={edit.onClose}
        profile={toEdit}
        classes={classes}
        subjects={subjects}
        initialClassIds={toEdit ? assignments[toEdit.id] ?? [] : []}
        initialSubjectIds={toEdit ? subjectAssignments[toEdit.id] ?? [] : []}
        onUpdated={onUpdated}
      />
      <TeacherDeleteModal isOpen={del.isOpen} onClose={del.onClose} profile={toDelete} onDeleted={onDeleted} />
    </div>
  );
}

"use client";

import { Button, Card, CardBody, Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, useDisclosure } from "@heroui/react";
import { Plus, ShieldCheck, GraduationCap, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Profile } from "@/types";
import { TeacherCreateModal } from "./teacher-create-modal";
import { TeacherDeleteModal } from "./teacher-delete-modal";

export function TeachersClient({ profiles: initial }: { profiles: Profile[] }) {
  const [profiles, setProfiles] = useState(initial);
  const create = useDisclosure();
  const del = useDisclosure();
  const [toDelete, setToDelete] = useState<Profile | null>(null);

  const onCreated = (p: Profile) => setProfiles((arr) => [p, ...arr]);
  const onDeleted = (id: string) => setProfiles((arr) => arr.filter((p) => p.id !== id));

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Teachers & Admins</h1>
          <p className="text-default-500 text-sm">Manage accounts and roles</p>
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
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => { setToDelete(p); del.onOpen(); }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <TeacherCreateModal isOpen={create.isOpen} onClose={create.onClose} onCreated={onCreated} />
      <TeacherDeleteModal isOpen={del.isOpen} onClose={del.onClose} profile={toDelete} onDeleted={onDeleted} />
    </div>
  );
}

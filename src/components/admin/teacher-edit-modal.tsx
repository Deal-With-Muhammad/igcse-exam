"use client";

import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Class, Profile, UserRole } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  classes: Class[];
  initialClassIds: string[];
  onUpdated: (p: Profile, classIds: string[]) => void;
}

export function TeacherEditModal({ isOpen, onClose, profile, classes, initialClassIds, onUpdated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("teacher");
  const [classIds, setClassIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !profile) return;
    setName(profile.full_name || "");
    setEmail(profile.email || "");
    setPassword("");
    setRole(profile.role);
    setClassIds(new Set(initialClassIds));
  }, [isOpen, profile, initialClassIds]);

  const submit = async () => {
    if (!profile) return;
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/teachers/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          email,
          password: password || undefined,
          role,
          class_ids: Array.from(classIds),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error || "Failed");
        return;
      }
      onUpdated(body.profile, body.class_ids ?? []);
      toast.success("Account updated");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent>
        <ModalHeader>Edit {profile?.full_name || profile?.email}</ModalHeader>
        <ModalBody className="space-y-3">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} isRequired />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} isRequired />
          <Input label="Reset password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} description="Leave blank to keep the current password" />
          <Select label="Role" selectedKeys={[role]} onChange={(e) => setRole((e.target.value || "teacher") as UserRole)}>
            <SelectItem key="teacher">Teacher</SelectItem>
            <SelectItem key="admin">Admin</SelectItem>
          </Select>
          {role === "teacher" && (
            <Select
              label="Classes"
              selectionMode="multiple"
              placeholder="Select one or more classes"
              selectedKeys={classIds}
              onSelectionChange={(keys) => setClassIds(new Set(keys as Set<string>))}
              description="Teacher sees exams from all selected classes. Leave empty to see every class."
            >
              {classes.map((c) => <SelectItem key={c.id}>{c.name}</SelectItem>)}
            </Select>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={submit} isLoading={loading}>Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

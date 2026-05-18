"use client";

import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Class, Profile, UserRole } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (p: Profile) => void;
}

export function TeacherCreateModal({ isOpen, onClose, onCreated }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("teacher");
  const [classId, setClassId] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const supabase = createClient();
    supabase.from("classes").select("*").order("sort_order").then(({ data }) => {
      setClasses((data ?? []) as Class[]);
    });
  }, [isOpen]);

  const submit = async () => {
    if (!email.trim() || !password || !name.trim()) {
      toast.error("Fill all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: name, role, class_id: classId || null }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error || "Failed");
        return;
      }
      onCreated(body.profile);
      toast.success("Account created");
      setEmail(""); setName(""); setPassword(""); setRole("teacher"); setClassId("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent>
        <ModalHeader>Add Teacher / Admin</ModalHeader>
        <ModalBody className="space-y-3">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} isRequired />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} isRequired />
          <Input label="Initial password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} description="They can change it after sign-in" isRequired />
          <Select label="Role" selectedKeys={[role]} onChange={(e) => setRole((e.target.value || "teacher") as UserRole)}>
            <SelectItem key="teacher">Teacher</SelectItem>
            <SelectItem key="admin">Admin</SelectItem>
          </Select>
          {role === "teacher" && (
            <Select
              label="Class (optional)"
              placeholder="Teacher sees all exams if no class chosen"
              selectedKeys={classId ? [classId] : []}
              onChange={(e) => setClassId(e.target.value)}
            >
              {classes.map((c) => <SelectItem key={c.id}>{c.name}</SelectItem>)}
            </Select>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={submit} isLoading={loading}>Create</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

"use client";

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { Profile } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onDeleted: (id: string) => void;
}

export function TeacherDeleteModal({ isOpen, onClose, profile, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/teachers/${profile.id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error || "Failed");
        return;
      }
      onDeleted(profile.id);
      toast.success("Account deleted");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent>
        <ModalHeader>Delete account?</ModalHeader>
        <ModalBody>
          <p>Delete <strong>{profile?.full_name || profile?.email}</strong>?</p>
          <p className="text-sm text-danger">All exams created by this user will be permanently deleted along with submissions.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancel</Button>
          <Button color="danger" onPress={submit} isLoading={loading}>Delete</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

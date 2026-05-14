"use client";

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { AlertTriangle } from "lucide-react";

export function WarningModal({ isOpen, timeLeft, warnings }: { isOpen: boolean; timeLeft: number; warnings: number }) {
  return (
    <Modal isOpen={isOpen} isDismissable={false} hideCloseButton size="md">
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center text-warning">
          <AlertTriangle size={20} /> Focus lost
        </ModalHeader>
        <ModalBody>
          <p className="font-medium">Return to the exam window immediately!</p>
          <div className="bg-warning-50 border border-warning-200 rounded p-4 my-2">
            <p className="text-xs text-warning-800 mb-1">Time before auto-termination</p>
            <p className="text-4xl font-bold text-warning-800 text-center">{timeLeft}s</p>
          </div>
          <ul className="text-sm space-y-1 list-disc ml-4">
            <li>Your answers ARE saved — no data is lost</li>
            <li>Warning #{warnings} recorded for the teacher</li>
            <li>Exceeding 60s away will auto-submit and flag your exam</li>
          </ul>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export function TerminationModal({ isOpen, warnings, switches, onClose }: { isOpen: boolean; warnings: number; switches: number; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} isDismissable={false} hideCloseButton size="md">
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center text-danger">
          <AlertTriangle size={20} /> Exam Terminated
        </ModalHeader>
        <ModalBody className="text-center space-y-2">
          <p className="text-lg font-medium">Your exam was auto-terminated</p>
          <p className="text-sm text-default-600">You were away from the exam window for more than 1 minute. Your answers have been submitted automatically and the teacher has been notified.</p>
          <div className="bg-danger-50 border border-danger-200 rounded p-3 inline-block mt-2">
            <p className="text-xs text-danger-700">Warnings: <strong>{warnings}</strong></p>
            <p className="text-xs text-danger-700">Tab switches: <strong>{switches}</strong></p>
          </div>
        </ModalBody>
        <ModalFooter className="justify-center">
          <Button color="primary" onPress={onClose}>Submit and Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

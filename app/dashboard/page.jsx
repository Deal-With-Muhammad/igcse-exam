"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  PlusIcon,
  FileTextIcon,
  CheckSquareIcon,
  EditIcon,
  Trash2Icon,
  MoreVerticalIcon,
} from "lucide-react";

export default function Dashboard() {
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examToDelete, setExamToDelete] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const examsCollection = collection(db, "exams");
      const examsSnapshot = await getDocs(examsCollection);
      const examsList = examsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExams(examsList);

      // Fetch submissions that need grading
      const submissionsCollection = collection(db, "submissions");
      const submissionsQuery = query(
        submissionsCollection,
        where("graded", "==", false)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      const submissionsList = submissionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubmissions(submissionsList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (exam) => {
    setExamToDelete(exam);
    onOpen();
  };

  const deleteExam = async () => {
    if (!examToDelete) return;

    try {
      setIsDeleting(true);
      const examId = examToDelete.id;

      // Start a batch to delete everything at once
      const batch = writeBatch(db);

      // 1. Delete the exam itself
      const examRef = doc(db, "exams", examId);
      batch.delete(examRef);

      // 2. Delete all submissions for this exam
      const submissionsQuery = query(
        collection(db, "submissions"),
        where("examId", "==", examId)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);

      submissionsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 3. Execute the batch
      await batch.commit();

      // Update local state
      setExams(exams.filter((exam) => exam.id !== examId));

      // Show success message
      alert(
        `Exam "${examToDelete.title}" and all its submissions have been deleted successfully.`
      );
    } catch (error) {
      console.error("Error deleting exam:", error);
      alert("Failed to delete exam. Please try again.");
    } finally {
      setIsDeleting(false);
      onClose();
      setExamToDelete(null);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <Link href="/dashboard/create-exam">
          <Button color="primary" startContent={<PlusIcon size={16} />}>
            Create New Exam
          </Button>
        </Link>
      </div>

      <Tabs aria-label="Dashboard tabs">
        <Tab key="exams" title="My Exams">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {loading ? (
              <p>Loading exams...</p>
            ) : exams.length > 0 ? (
              exams.map((exam) => (
                <Card
                  key={exam.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{exam.title}</h3>
                      <p className="text-small text-default-500">
                        {exam.questions?.length || 0} Questions
                      </p>
                    </div>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly variant="light" size="sm">
                          <MoreVerticalIcon size={16} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Exam actions">
                        <DropdownItem
                          key="edit"
                          startContent={<EditIcon size={16} />}
                          href={`/dashboard/edit-exam/${exam.id}`}
                        >
                          Edit Exam
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          startContent={<Trash2Icon size={16} />}
                          onClick={() => handleDeleteClick(exam)}
                        >
                          Delete Exam
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <p>
                          Share Code:{" "}
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {exam.id.substring(0, 6)}
                          </span>
                        </p>
                        <p className="text-xs text-default-500 mt-1">
                          Created:{" "}
                          {new Date(
                            exam.createdAt?.toDate()
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/edit-exam/${exam.id}`}>
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={<EditIcon size={16} />}
                          >
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/dashboard/exam/${exam.id}`}>
                          <Button size="sm" color="secondary" variant="flat">
                            Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">
                  No exams created yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new exam.
                </p>
                <Link
                  href="/dashboard/create-exam"
                  className="mt-4 inline-block"
                >
                  <Button color="primary" startContent={<PlusIcon size={16} />}>
                    Create New Exam
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Tab>
        <Tab key="submissions" title="Pending Submissions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {loading ? (
              <p>Loading submissions...</p>
            ) : submissions.length > 0 ? (
              submissions.map((submission) => (
                <Card
                  key={submission.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {submission.studentName}
                      </h3>
                      <p className="text-small text-default-500">
                        {submission.examTitle}
                      </p>
                      <p className="text-small text-default-500">
                        {submission.branchName || submission.branch}
                      </p>
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <p>
                          Submitted:{" "}
                          {new Date(
                            submission.submittedAt?.toDate()
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/dashboard/grade/${submission.id}`}>
                        <Button
                          size="sm"
                          color="success"
                          variant="flat"
                          startContent={<CheckSquareIcon size={16} />}
                        >
                          Grade
                        </Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <CheckSquareIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">
                  No pending submissions
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  All submissions have been graded.
                </p>
              </div>
            )}
          </div>
        </Tab>
      </Tabs>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Delete Exam
              </ModalHeader>
              <ModalBody>
                {examToDelete && (
                  <>
                    <p>
                      Are you sure you want to delete the exam{" "}
                      <strong>"{examToDelete.title}"</strong>?
                    </p>
                    <p className="text-danger text-sm">
                      ⚠️ This action will also delete all student submissions
                      for this exam and cannot be undone.
                    </p>
                    <div className="bg-warning-50 p-3 rounded-lg mt-2">
                      <p className="text-warning-700 text-sm">
                        <strong>Warning:</strong> This will delete:
                      </p>
                      <ul className="text-sm text-warning-700 ml-4 mt-1 list-disc">
                        <li>The exam itself</li>
                        <li>All student submissions</li>
                        <li>All grades and feedback</li>
                      </ul>
                    </div>
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={deleteExam}
                  isLoading={isDeleting}
                  startContent={<Trash2Icon size={16} />}
                >
                  {isDeleting ? "Deleting..." : "Delete Exam"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

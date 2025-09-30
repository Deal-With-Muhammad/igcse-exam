"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Accordion,
  AccordionItem,
} from "@nextui-org/react";
import { PlusIcon, Trash2Icon, SaveIcon, ArrowLeftIcon } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

const questionTypes = [
  { value: "mcq", label: "Multiple Choice" },
  { value: "long", label: "Long Answer" },
];

export default function CreateExam() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Bulk import states
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkQuestionType, setBulkQuestionType] = useState("mcq");

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        type: "mcq",
        text: "",
        options: ["", "", "", ""],
        correctOption: 0,
        points: 1,
      },
    ]);
  };

  const parseQuestionText = (text, questionIndex) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length >= 2) {
      // First line is the question
      const questionText = lines[0];

      // Remaining lines are options (take up to 4)
      const options = lines.slice(1, 5);

      // If we have at least 2 options, auto-populate
      if (options.length >= 2) {
        const updatedQuestions = [...questions];

        // Pad options to 4 if needed
        while (options.length < 4) {
          options.push("");
        }

        updatedQuestions[questionIndex] = {
          ...updatedQuestions[questionIndex],
          text: questionText,
          options: options,
        };

        setQuestions(updatedQuestions);
        return;
      }
    }

    // If parsing didn't work, just update the text normally
    updateQuestion(questionIndex, "text", text);
  };

  // Bulk import parser
  const parseBulkQuestions = (text, questionType) => {
    // Split by asterisk or numbers followed by period/parenthesis
    const questionBlocks = text
      .split(/\n\s*[\*•\d+\.\)\]]\s*/)
      .map((block) => block.trim())
      .filter((block) => block.length > 0);

    const newQuestions = [];

    questionBlocks.forEach((block) => {
      if (questionType === "mcq") {
        // Split the block into lines
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        if (lines.length >= 1) {
          const questionText = lines[0];

          // Extract options - look for lines starting with A), B), etc or just take all lines after first
          const options = [];
          for (let i = 1; i < lines.length && options.length < 4; i++) {
            const line = lines[i];
            // Remove common option prefixes like A), B), a), b), A., etc
            const cleanedOption = line
              .replace(/^[A-Da-d][\.\)\]\:]?\s*/, "")
              .trim();
            if (cleanedOption) {
              options.push(cleanedOption);
            }
          }

          // Ensure we have 4 options
          while (options.length < 4) {
            options.push("");
          }

          newQuestions.push({
            id: Date.now().toString() + Math.random(),
            type: "mcq",
            text: questionText,
            options: options.slice(0, 4),
            correctOption: 0,
            points: 1,
          });
        }
      } else if (questionType === "long") {
        // For long answer, just take the whole block as the question
        if (block.trim()) {
          newQuestions.push({
            id: Date.now().toString() + Math.random(),
            type: "long",
            text: block.trim(),
            options: [],
            points: 1,
          });
        }
      }
    });

    return newQuestions;
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) {
      alert("Please paste some questions");
      return;
    }

    const parsedQuestions = parseBulkQuestions(bulkText, bulkQuestionType);

    if (parsedQuestions.length === 0) {
      alert(
        "No valid questions found. Make sure each question starts with * or a number."
      );
      return;
    }

    setQuestions([...questions, ...parsedQuestions]);
    setBulkText("");
    setShowBulkImport(false);
    alert(`Successfully imported ${parsedQuestions.length} question(s)!`);
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  const handleTypeChange = (questionIndex, newType) => {
    const updatedQuestions = [...questions];
    const currentQuestion = { ...updatedQuestions[questionIndex] };

    // Update the question type
    currentQuestion.type = newType;

    // If changing to MCQ, initialize options
    if (
      newType === "mcq" &&
      (!currentQuestion.options || currentQuestion.options.length === 0)
    ) {
      currentQuestion.options = ["", "", "", ""];
      currentQuestion.correctOption = 0;
    }

    updatedQuestions[questionIndex] = currentQuestion;
    setQuestions(updatedQuestions);
  };

  const handleQuestionTextChange = (questionIndex, value) => {
    const question = questions[questionIndex];

    // Only auto-parse for MCQ questions
    if (question.type === "mcq") {
      parseQuestionText(value, questionIndex);
    } else {
      updateQuestion(questionIndex, "text", value);
    }
  };

  const saveExam = async () => {
    if (!title.trim()) {
      alert("Please enter an exam title");
      return;
    }

    if (questions.length === 0) {
      alert("Please add at least one question");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Question ${i + 1} is missing text`);
        return;
      }

      if (q.type === "mcq") {
        const emptyOptions = q.options.filter((opt) => !opt.trim()).length;
        if (emptyOptions > 0) {
          alert(`Question ${i + 1} has empty options`);
          return;
        }
      }
    }

    try {
      setLoading(true);

      const examData = {
        title,
        description,
        questions,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "exams"), examData);
      alert(
        `Exam created successfully! Share code: ${docRef.id.substring(0, 6)}`
      );
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving exam:", error);
      alert("Failed to save exam. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button isIconOnly variant="light" aria-label="Back">
            <ArrowLeftIcon size={20} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-2">Create New Exam</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">Exam Details</h2>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          <Input
            label="Exam Title"
            placeholder="Enter exam title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            isRequired
          />
          <Textarea
            label="Description (Optional)"
            placeholder="Enter exam description or instructions"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </CardBody>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Questions</h2>
        <div className="flex gap-2">
          <Button
            color="secondary"
            variant="flat"
            onClick={() => setShowBulkImport(true)}
          >
            Bulk Import
          </Button>
          <Button
            color="primary"
            startContent={<PlusIcon size={16} />}
            onClick={addQuestion}
          >
            Add Question
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <Card className="text-center p-8">
          <p className="text-default-500 mb-4">No questions added yet</p>
          <Button
            color="primary"
            startContent={<PlusIcon size={16} />}
            onClick={addQuestion}
            className="mx-auto"
          >
            Add Your First Question
          </Button>
        </Card>
      ) : (
        <Accordion>
          {questions.map((question, qIndex) => (
            <AccordionItem
              key={question.id}
              title={
                <div className="flex items-center gap-2">
                  <span>Question {qIndex + 1}</span>
                  <Chip
                    size="sm"
                    color={question.type === "mcq" ? "primary" : "secondary"}
                  >
                    {question.type === "mcq"
                      ? "Multiple Choice"
                      : "Long Answer"}
                  </Chip>
                </div>
              }
            >
              <Card className="mb-4">
                <CardBody className="space-y-4">
                  <div className="flex justify-between gap-4">
                    <Select
                      label="Question Type"
                      selectedKeys={[question.type]}
                      onChange={(e) => handleTypeChange(qIndex, e.target.value)}
                      className="max-w-xs"
                    >
                      {questionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </Select>

                    <Input
                      type="number"
                      label="Points"
                      min={1}
                      max={100}
                      value={question.points.toString()}
                      onChange={(e) =>
                        updateQuestion(
                          qIndex,
                          "points",
                          Number.parseInt(e.target.value) || 1
                        )
                      }
                      className="max-w-[100px]"
                    />
                  </div>

                  <Textarea
                    label="Question Text"
                    placeholder={
                      question.type === "mcq"
                        ? "Paste question with options (each on new line):\nWhat is 2+2?\nA. 3\nB. 4\nC. 5\nD. 6"
                        : "Enter your question"
                    }
                    value={question.text}
                    onChange={(e) =>
                      handleQuestionTextChange(qIndex, e.target.value)
                    }
                    isRequired
                    minRows={question.type === "mcq" ? 6 : 3}
                  />

                  {question.type === "mcq" && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Options</p>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <Input
                            placeholder={`Option ${oIndex + 1}`}
                            value={option}
                            onChange={(e) =>
                              updateOption(qIndex, oIndex, e.target.value)
                            }
                            className="flex-grow"
                          />
                          <Button
                            isIconOnly
                            color="primary"
                            variant={
                              question.correctOption === oIndex
                                ? "solid"
                                : "bordered"
                            }
                            onClick={() =>
                              updateQuestion(qIndex, "correctOption", oIndex)
                            }
                            aria-label="Set as correct answer"
                          >
                            ✓
                          </Button>
                        </div>
                      ))}
                      <p className="text-xs text-default-500">
                        Click ✓ to mark the correct answer. Tip: Paste question
                        with options above (each on new line) to auto-fill!
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      color="danger"
                      variant="light"
                      startContent={<Trash2Icon size={16} />}
                      onClick={() => removeQuestion(qIndex)}
                    >
                      Remove Question
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <div className="flex justify-between mt-8">
        <Button
          color="default"
          variant="flat"
          onClick={() => router.push("/dashboard")}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          startContent={<SaveIcon size={16} />}
          onClick={saveExam}
          isLoading={loading}
        >
          Save Exam
        </Button>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Bulk Import Questions</h2>
              <Button
                isIconOnly
                variant="light"
                onClick={() => setShowBulkImport(false)}
              >
                ✕
              </Button>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <Select
                label="Question Type"
                selectedKeys={[bulkQuestionType]}
                onChange={(e) => setBulkQuestionType(e.target.value)}
                className="max-w-xs"
              >
                {questionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </Select>

              <div className="bg-default-100 p-3 rounded-lg text-sm space-y-2">
                <p className="font-semibold">Format Instructions:</p>
                <p>• Start each question with * or a number</p>
                <p>
                  • For MCQ: Add options on new lines (with A), B), etc. or
                  without)
                </p>
                <p>• For Long Answer: Just list the questions</p>
                <p className="text-xs text-default-500 mt-2">Example MCQ:</p>
                <pre className="text-xs bg-default-200 p-2 rounded mt-1 overflow-x-auto">
                  {`* What is 2+2?
A) 3
B) 4
C) 5
D) 6
* What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid`}
                </pre>
              </div>

              <Textarea
                label="Paste Questions Here"
                placeholder="Paste your questions here..."
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                minRows={15}
              />

              <div className="flex justify-end gap-2">
                <Button variant="flat" onClick={() => setShowBulkImport(false)}>
                  Cancel
                </Button>
                <Button color="primary" onClick={handleBulkImport}>
                  Import Questions
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

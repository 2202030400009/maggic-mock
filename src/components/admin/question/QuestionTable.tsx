
import React from "react";
import { Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";

interface QuestionTableProps {
  questions: Question[];
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (question: Question) => void;
}

const QuestionTable: React.FC<QuestionTableProps> = ({ 
  questions, 
  onEditQuestion, 
  onDeleteQuestion 
}) => {
  // Get question type badge class
  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case "MCQ":
        return "bg-blue-100 text-blue-800";
      case "MSQ":
        return "bg-purple-100 text-purple-800";
      case "NAT":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Question</TableHead>
            <TableHead className="w-28">Type</TableHead>
            <TableHead className="w-32">Subject</TableHead>
            <TableHead className="w-24">Marks</TableHead>
            <TableHead className="w-24">Negative</TableHead>
            <TableHead className="w-28">Paper/Year</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question, index) => (
            <TableRow key={question.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell className="max-w-md truncate">{question.text}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeBadge(question.type)}`}>
                  {question.type}
                </span>
              </TableCell>
              <TableCell>{question.subject}</TableCell>
              <TableCell>{question.marks}</TableCell>
              <TableCell>{question.negativeMark}</TableCell>
              <TableCell>{question.paperType || "General"}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onEditQuestion(question)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => onDeleteQuestion(question)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default QuestionTable;

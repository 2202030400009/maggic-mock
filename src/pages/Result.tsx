
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, TrendingDown, Award, X } from "lucide-react";
import { Question, QuestionType } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SubjectPerformance {
  subject: string;
  total: number;
  scored: number;
  attempted: number;
  totalQuestions: number;
  percentage: number;
}

interface QuestionDetail {
  id: string;
  text: string;
  type: QuestionType;
  options?: { id: string; text: string }[];
  correctOption?: string;
  correctOptions?: string[];
  rangeStart?: number;
  rangeEnd?: number;
  userAnswer?: string | string[] | null;
  marks: number;
  negativeMark: number;
  subject: string;
  isCorrect: boolean;
  isSkipped: boolean;
}

interface TestResult {
  rawMarks: number;
  lossMarks: number;
  actualMarks: number;
  scaledMarks: number;
  totalMarks: number;
  subjectPerformance: SubjectPerformance[];
  weakSubjects: string[];
  testResponseId?: string;
  questions?: Question[];
  userAnswers?: (string | string[] | null)[];
  questionStatus?: Record<number, string>;
}

const Result = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionDetails, setQuestionDetails] = useState<QuestionDetail[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Load test results from session storage
    const storedResults = sessionStorage.getItem('testResults');
    
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
        
        // Process questions for the table
        if (parsedResults.questions && parsedResults.userAnswers) {
          const details = parsedResults.questions.map((q: Question, index: number) => {
            const userAnswer = parsedResults.userAnswers?.[index];
            let isCorrect = false;
            let isSkipped = userAnswer === null;
            
            // Check if the answer is correct based on question type
            if (q.type === "MCQ" && typeof userAnswer === "string") {
              isCorrect = userAnswer === q.correctOption;
            } 
            else if (q.type === "MSQ" && Array.isArray(userAnswer) && q.correctOptions) {
              const allCorrectSelected = q.correctOptions.every(
                opt => userAnswer.includes(opt)
              );
              const noIncorrectSelected = userAnswer.every(
                opt => q.correctOptions?.includes(opt)
              );
              isCorrect = allCorrectSelected && noIncorrectSelected;
            }
            else if (q.type === "NAT" && typeof userAnswer === "string" && 
                    q.rangeStart !== undefined && q.rangeEnd !== undefined) {
              const numAnswer = parseFloat(userAnswer);
              isCorrect = !isNaN(numAnswer) && 
                          numAnswer >= q.rangeStart && 
                          numAnswer <= q.rangeEnd;
            }
            
            return {
              ...q,
              userAnswer,
              isCorrect,
              isSkipped
            };
          });
          
          setQuestionDetails(details);
        }
      } catch (error) {
        console.error("Error parsing test results:", error);
      }
    }
    
    setLoading(false);
  }, []);

  const openQuestionDialog = (question: QuestionDetail) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  };

  const getRowColor = (question: QuestionDetail) => {
    if (question.isSkipped) return "bg-orange-50 hover:bg-orange-100";
    if (question.isCorrect) return "bg-green-50 hover:bg-green-100";
    // If answered but wrong and has negative marking
    if (!question.isCorrect && question.negativeMark > 0) return "bg-red-50 hover:bg-red-100";
    return "bg-orange-50 hover:bg-orange-100"; // For wrong but no negative marking
  };

  const getCorrectAnswerDisplay = (question: QuestionDetail) => {
    if (question.type === "MCQ" && question.correctOption) {
      const option = question.options?.find(o => o.id === question.correctOption);
      return `${question.correctOption.toUpperCase()}: ${option?.text || ""}`;
    } 
    else if (question.type === "MSQ" && question.correctOptions) {
      return question.correctOptions
        .map(id => {
          const option = question.options?.find(o => o.id === id);
          return `${id.toUpperCase()}: ${option?.text || ""}`;
        })
        .join(", ");
    }
    else if (question.type === "NAT") {
      return `${question.rangeStart} to ${question.rangeEnd}`;
    }
    return "-";
  };

  const getUserAnswerDisplay = (question: QuestionDetail) => {
    const { userAnswer, type } = question;
    
    if (!userAnswer) return "Skipped";
    
    if (type === "MCQ" && typeof userAnswer === "string") {
      const option = question.options?.find(o => o.id === userAnswer);
      return `${userAnswer.toUpperCase()}: ${option?.text || ""}`;
    } 
    else if (type === "MSQ" && Array.isArray(userAnswer)) {
      if (userAnswer.length === 0) return "None selected";
      return userAnswer
        .map(id => {
          const option = question.options?.find(o => o.id === id);
          return `${id.toUpperCase()}: ${option?.text || ""}`;
        })
        .join(", ");
    }
    else if (type === "NAT" && typeof userAnswer === "string") {
      return userAnswer;
    }
    return "-";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading results...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl mb-4">No test results found</p>
        <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center">
            <Award className="h-5 w-5 mr-2 text-indigo-600" />
            Test Results
          </h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium text-gray-500">Raw Marks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <span className="text-3xl font-bold">{results.rawMarks}</span>
                <span className="text-gray-500 ml-1">/ {results.totalMarks}</span>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500 mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium text-gray-500">Loss Marks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-red-500">-{results.lossMarks}</span>
              </div>
              <TrendingDown className="h-5 w-5 text-red-500 mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium text-gray-500">Final Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <span className="text-3xl font-bold">{results.scaledMarks}</span>
                <span className="text-gray-500 ml-1">
                  {results.totalMarks === 65 ? "/ 100" : `/ ${results.totalMarks}`}
                </span>
                <span className="ml-2 text-gray-500">
                  ({Math.round((results.scaledMarks / (results.totalMarks === 65 ? 100 : results.totalMarks)) * 100)}%)
                </span>
              </div>
              <Progress
                className="mt-2"
                value={(results.scaledMarks / (results.totalMarks === 65 ? 100 : results.totalMarks)) * 100}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weak Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                {results.weakSubjects && results.weakSubjects.length > 0 ? (
                  <ul className="space-y-2">
                    {results.weakSubjects.map((subject, index) => (
                      <li key={index} className="flex items-center p-2 bg-red-50 rounded-md">
                        <div className="w-1 h-8 bg-red-500 rounded-full mr-3"></div>
                        <span>{subject}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center py-4">No weak subjects identified. Great job!</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subject Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Subject</th>
                        <th className="text-center py-2 px-2">Total Marks</th>
                        <th className="text-center py-2 px-2">Scored</th>
                        <th className="text-center py-2 px-2">Attempted</th>
                        <th className="text-center py-2 px-2">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.subjectPerformance.map((subject, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 px-2">{subject.subject}</td>
                          <td className="text-center py-3 px-2">{subject.total}</td>
                          <td className="text-center py-3 px-2">{subject.scored}</td>
                          <td className="text-center py-3 px-2">
                            {subject.attempted}/{subject.totalQuestions}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-center">
                              <Progress
                                className="h-2 w-24"
                                value={subject.percentage}
                              />
                              <span className="ml-2 text-xs">{subject.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Question Analysis Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Question Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Marked Answer</TableHead>
                    <TableHead>Correct Answer</TableHead>
                    <TableHead>Scored</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questionDetails.map((question, index) => (
                    <TableRow 
                      key={question.id} 
                      className={`cursor-pointer ${getRowColor(question)}`}
                      onClick={() => openQuestionDialog(question)}
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{question.type}</TableCell>
                      <TableCell>{question.marks}</TableCell>
                      <TableCell>{getUserAnswerDisplay(question)}</TableCell>
                      <TableCell>{getCorrectAnswerDisplay(question)}</TableCell>
                      <TableCell>
                        {question.isCorrect 
                          ? question.marks 
                          : (question.isSkipped 
                            ? "0" 
                            : `-${question.negativeMark}`)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center mt-8">
          <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
        </div>
      </main>

      {/* Question Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                Question Analysis
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedQuestion?.isCorrect 
                    ? "bg-green-100 text-green-800" 
                    : (selectedQuestion?.isSkipped 
                      ? "bg-orange-100 text-orange-800" 
                      : "bg-red-100 text-red-800")
                }`}>
                  {selectedQuestion?.isCorrect 
                    ? "Correct" 
                    : (selectedQuestion?.isSkipped 
                      ? "Skipped" 
                      : "Incorrect")}
                </span>
              </div>
              <DialogClose>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {selectedQuestion?.subject} • {selectedQuestion?.type} • {selectedQuestion?.marks} mark{selectedQuestion?.marks !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuestion && (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-medium">Question</h3>
                <p className="mt-1">{selectedQuestion.text}</p>
              </div>
              
              {selectedQuestion.options && (selectedQuestion.type === "MCQ" || selectedQuestion.type === "MSQ") && (
                <div>
                  <h3 className="font-medium mb-2">Options</h3>
                  <div className="space-y-2">
                    {selectedQuestion.options.map(option => (
                      <div key={option.id} className={`p-2 rounded ${
                        selectedQuestion.type === "MCQ" 
                          ? (option.id === selectedQuestion.correctOption 
                            ? "bg-green-50 border border-green-200" 
                            : (typeof selectedQuestion.userAnswer === "string" && option.id === selectedQuestion.userAnswer && option.id !== selectedQuestion.correctOption
                              ? "bg-red-50 border border-red-200"
                              : "bg-gray-50 border border-gray-200"))
                          : (selectedQuestion.correctOptions?.includes(option.id)
                            ? "bg-green-50 border border-green-200"
                            : (Array.isArray(selectedQuestion.userAnswer) && selectedQuestion.userAnswer.includes(option.id) && !selectedQuestion.correctOptions?.includes(option.id)
                              ? "bg-red-50 border border-red-200"
                              : "bg-gray-50 border border-gray-200"))
                      }`}>
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center mr-3">
                            {option.id.toUpperCase()}
                          </div>
                          <span>{option.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedQuestion.type === "NAT" && (
                <div>
                  <h3 className="font-medium">Numerical Answer Range</h3>
                  <p className="mt-1">{selectedQuestion.rangeStart} to {selectedQuestion.rangeEnd}</p>
                  
                  <h3 className="font-medium mt-3">Your Answer</h3>
                  <p className="mt-1">{selectedQuestion.userAnswer || "Not answered"}</p>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">Your Answer:</span> {getUserAnswerDisplay(selectedQuestion)}
                  </div>
                  <div>
                    <span className="font-medium">Marks:</span> {
                      selectedQuestion.isCorrect 
                        ? `+${selectedQuestion.marks}` 
                        : (selectedQuestion.isSkipped 
                            ? "0" 
                            : `-${selectedQuestion.negativeMark}`)
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Result;

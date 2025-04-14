
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface TestResponseData {
  id: string;
  userEmail: string;
  testType: string;
  paperType: string;
  year?: string | null;
  specialTestId?: string;
  specialTestName?: string;
  totalMarks: number;
  scoredMarks: number;
  scaledMarks: number;
  lossMarks: number;
  timestamp: any;
  totalTime: number;
  subjectPerformance?: Array<{
    subject: string;
    correct: number;
    incorrect: number;
    unattempted: number;
    total: number;
  }>;
  questions?: Array<any>;
}

const TestResponseView = () => {
  const { responseId } = useParams<{ responseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<TestResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResponseData = async () => {
      try {
        setLoading(true);
        
        if (!responseId) {
          setError("No response ID provided");
          setLoading(false);
          return;
        }
        
        const responseRef = doc(db, "testResponses", responseId);
        const responseSnap = await getDoc(responseRef);
        
        if (!responseSnap.exists()) {
          setError("Test response not found");
          setLoading(false);
          return;
        }
        
        const data = responseSnap.data();
        
        setResponse({
          id: responseSnap.id,
          userEmail: data.userEmail || "Unknown User",
          testType: data.testType || "Unknown",
          paperType: data.paperType || "Unknown",
          year: data.year,
          specialTestId: data.specialTestId,
          specialTestName: data.specialTestName,
          totalMarks: data.totalMarks || 0,
          scoredMarks: data.scoredMarks || 0,
          scaledMarks: data.scaledMarks || 0,
          lossMarks: data.lossMarks || 0,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
          totalTime: data.totalTime || 0,
          subjectPerformance: data.subjectPerformance || [],
          questions: data.questions || []
        });
      } catch (err) {
        console.error("Error fetching response data:", err);
        setError("Failed to load response data");
      } finally {
        setLoading(false);
      }
    };

    fetchResponseData();
  }, [responseId]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTestTypeDisplay = () => {
    if (!response) return "";

    switch (response.testType) {
      case "PYQ": 
        return `${response.year} PYQ`;
      case "SPECIAL": 
        return `Special Test: ${response.specialTestName || "Unnamed"}`;
      case "FULL_SYLLABUS": 
        return "Full Syllabus Test";
      case "SUBJECT_WISE": 
        return "Subject-Wise Test";
      case "MULTI_SUBJECT": 
        return "Multi-Subject Test";
      default: 
        return response.testType;
    }
  };

  const isCorrectAnswer = (question: any): boolean => {
    if (!question.userAnswer) return false;

    if (question.type === "MCQ") {
      return question.userAnswer === question.correctOption;
    } else if (question.type === "MSQ") {
      // For MSQ, check if the selected options match the correct options
      const correctOptions = question.correctOptions || [];
      const userOptions = Array.isArray(question.userAnswer) ? question.userAnswer : [];
      
      return (
        correctOptions.length === userOptions.length &&
        correctOptions.every(opt => userOptions.includes(opt))
      );
    } else if (question.type === "NAT") {
      const userValue = parseFloat(question.userAnswer);
      return userValue >= question.rangeStart && userValue <= question.rangeEnd;
    }
    
    return false;
  };

  const getUserAnswer = (question: any): string => {
    if (!question.userAnswer) return "Not attempted";

    if (question.type === "MCQ") {
      const option = question.options?.find((opt: any) => opt.id === question.userAnswer);
      return option ? `${question.userAnswer.toUpperCase()}: ${option.text}` : question.userAnswer;
    } else if (question.type === "MSQ") {
      if (!Array.isArray(question.userAnswer) || question.userAnswer.length === 0) {
        return "Not attempted";
      }
      
      return question.userAnswer.map((optId: string) => {
        const option = question.options?.find((opt: any) => opt.id === optId);
        return option ? `${optId.toUpperCase()}: ${option.text}` : optId;
      }).join(", ");
    } else if (question.type === "NAT") {
      return question.userAnswer;
    }
    
    return String(question.userAnswer);
  };

  const getCorrectAnswer = (question: any): string => {
    if (question.type === "MCQ") {
      const option = question.options?.find((opt: any) => opt.id === question.correctOption);
      return option ? `${question.correctOption.toUpperCase()}: ${option.text}` : question.correctOption;
    } else if (question.type === "MSQ") {
      if (!Array.isArray(question.correctOptions) || question.correctOptions.length === 0) {
        return "N/A";
      }
      
      return question.correctOptions.map((optId: string) => {
        const option = question.options?.find((opt: any) => opt.id === optId);
        return option ? `${optId.toUpperCase()}: ${option.text}` : optId;
      }).join(", ");
    } else if (question.type === "NAT") {
      return `${question.rangeStart} to ${question.rangeEnd}`;
    }
    
    return "N/A";
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p>Loading response data...</p>
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error || "Failed to load test response"}</p>
          <Button onClick={() => navigate("/admin")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Test Response Details</h1>
          <Badge variant="outline">{response.paperType}</Badge>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin/test-responses")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Responses
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">User</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium truncate">{response.userEmail}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Test Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{getTestTypeDisplay()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Date Taken</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {format(response.timestamp, "dd MMM yyyy, HH:mm")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Score Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Raw Score</h3>
              <p className="text-2xl font-bold">
                {response.scoredMarks} / {response.totalMarks}
              </p>
              <p className="text-sm text-gray-500">
                ({Math.round((response.scoredMarks / response.totalMarks) * 100)}%)
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Scaled Score</h3>
              <p className="text-2xl font-bold">{response.scaledMarks}</p>
              <p className="text-sm text-gray-500">Out of 100</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Negative Marks</h3>
              <p className="text-2xl font-bold text-red-600">-{Math.abs(response.lossMarks).toFixed(2)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Time Taken</h3>
              <p className="text-2xl font-bold">{formatTime(response.totalTime)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {response.subjectPerformance && response.subjectPerformance.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Correct</TableHead>
                  <TableHead className="text-right">Incorrect</TableHead>
                  <TableHead className="text-right">Unattempted</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {response.subjectPerformance.map((subject, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{subject.subject}</TableCell>
                    <TableCell className="text-right text-green-600">{subject.correct}</TableCell>
                    <TableCell className="text-right text-red-600">{subject.incorrect}</TableCell>
                    <TableCell className="text-right text-gray-500">{subject.unattempted}</TableCell>
                    <TableCell className="text-right">
                      {subject.correct}/{subject.total} ({Math.round((subject.correct / subject.total) * 100)}%)
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {response.questions && response.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Question Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {response.questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Q{index + 1}.</span>
                      <Badge variant="outline">{question.type}</Badge>
                      <Badge variant="outline">{question.subject}</Badge>
                      <Badge>{question.marks} {question.marks > 1 ? "marks" : "mark"}</Badge>
                    </div>
                    <Badge 
                      variant={isCorrectAnswer(question) ? "success" : question.userAnswer ? "destructive" : "secondary"}
                      className={isCorrectAnswer(question) ? "bg-green-100 text-green-800 hover:bg-green-200" : 
                        question.userAnswer ? "bg-red-100 text-red-800 hover:bg-red-200" : ""}
                    >
                      {isCorrectAnswer(question) ? "Correct" : question.userAnswer ? "Incorrect" : "Not Attempted"}
                    </Badge>
                  </div>
                  
                  <p className="mb-4">{question.text}</p>
                  
                  {question.imageUrl && (
                    <div className="mb-4">
                      <img 
                        src={question.imageUrl} 
                        alt="Question" 
                        className="max-h-[200px] object-contain mx-auto"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "https://placehold.co/400x200/f5f5f5/cccccc?text=Failed+to+load+image";
                        }}
                      />
                    </div>
                  )}
                  
                  {(question.type === "MCQ" || question.type === "MSQ") && question.options && (
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {question.options.map((option: any) => (
                        <div 
                          key={option.id}
                          className={`p-2 border rounded flex items-center
                            ${question.userAnswer === option.id || 
                              (Array.isArray(question.userAnswer) && question.userAnswer.includes(option.id)) 
                                ? 'bg-blue-50 border-blue-300' 
                                : ''}
                            ${question.type === "MCQ" && question.correctOption === option.id 
                                ? 'border-green-500' 
                                : ''}
                            ${question.type === "MSQ" && question.correctOptions?.includes(option.id) 
                                ? 'border-green-500' 
                                : ''}
                          `}
                        >
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-medium mr-3">
                            {option.id.toUpperCase()}
                          </div>
                          <span>{option.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Separator className="my-3" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-500">User's Answer:</p>
                      <p>{getUserAnswer(question)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Correct Answer:</p>
                      <p>{getCorrectAnswer(question)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestResponseView;

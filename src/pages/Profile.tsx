
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Eye, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TestResponse {
  id: string;
  testType: string;
  paperType: string;
  year: string | null;
  scoredMarks: number;
  scaledMarks: number;
  totalMarks: number;
  timestamp: any;
  questions: {
    questionId: string;
    questionText: string;
    questionType: string;
    options?: { id: string; text: string }[];
    correctOption?: string;
    correctOptions?: string[];
    userAnswer?: string | string[];
    marks: number;
    subject: string;
  }[];
  subjectPerformance: {
    subject: string;
    total: number;
    scored: number;
    attempted: number;
    totalQuestions: number;
    percentage: number;
  }[];
}

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [testHistory, setTestHistory] = useState<TestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<TestResponse | null>(null);
  const [viewingQuestions, setViewingQuestions] = useState(false);

  useEffect(() => {
    const fetchTestHistory = async () => {
      if (!currentUser) return;

      try {
        const q = query(
          collection(db, "testResponses"),
          where("userId", "==", currentUser.uid),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        const tests = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as TestResponse[];

        setTestHistory(tests);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching test history:", error);
        setLoading(false);
      }
    };

    fetchTestHistory();
  }, [currentUser]);

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return "N/A";
    
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">My Profile</h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Email</div>
                    <div>{currentUser?.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Total Tests Taken</div>
                    <div>{testHistory.length}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-4">Loading test history...</p>
              ) : testHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Paper</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testHistory.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-indigo-500" />
                            {test.testType === "PYQ" 
                              ? `PYQ ${test.year}` 
                              : test.testType}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{test.paperType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="font-medium">{test.scaledMarks}/100</span>
                            <Progress 
                              value={test.scaledMarks} 
                              className="h-2 w-16 ml-2"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(test.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setSelectedTest(test);
                              setViewingQuestions(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">You haven't taken any tests yet.</p>
                  <Button onClick={() => navigate("/dashboard")}>
                    Take a Test
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Test Results Dialog */}
      {selectedTest && (
        <Dialog open={viewingQuestions} onOpenChange={setViewingQuestions}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTest.testType === "PYQ" 
                  ? `${selectedTest.paperType} PYQ ${selectedTest.year}`
                  : `${selectedTest.paperType} ${selectedTest.testType}`}
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex justify-between items-center mb-6">
                <Badge variant="outline" className="text-base">
                  Score: {selectedTest.scaledMarks}/100
                </Badge>
                <div className="text-sm text-gray-500">
                  {formatDate(selectedTest.timestamp)}
                </div>
              </div>
              
              <Tabs defaultValue="performance">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
                  <TabsTrigger value="questions">Question Review</TabsTrigger>
                </TabsList>
                
                <TabsContent value="performance" className="pt-4">
                  <h3 className="text-lg font-medium mb-4">Subject Performance</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTest.subjectPerformance?.map((subject, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{subject.subject}</TableCell>
                          <TableCell>
                            {subject.scored}/{subject.total}
                          </TableCell>
                          <TableCell>
                            {subject.attempted}/{subject.totalQuestions}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Progress 
                                value={subject.percentage} 
                                className="h-2 w-20 mr-2"
                              />
                              <span>{subject.percentage}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="questions" className="pt-4">
                  <h3 className="text-lg font-medium mb-4">Question Review</h3>
                  <div className="space-y-6">
                    {selectedTest.questions?.map((question, qIndex) => (
                      <Card key={qIndex} className={
                        question.userAnswer ? 
                        (question.questionType === "MCQ" && question.userAnswer === question.correctOption) ||
                        (question.questionType === "MSQ" && 
                         Array.isArray(question.userAnswer) && 
                         Array.isArray(question.correctOptions) &&
                         question.userAnswer.length === question.correctOptions.length &&
                         question.userAnswer.every(a => question.correctOptions?.includes(a)))
                         ? "border-green-200 bg-green-50"
                         : "border-red-200 bg-red-50"
                         : "border-gray-200"
                      }>
                        <CardContent className="pt-6">
                          <div className="flex justify-between mb-2">
                            <Badge variant="outline">{question.subject}</Badge>
                            <span className="text-sm text-gray-500">
                              {question.marks} mark{question.marks > 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="mb-4">{qIndex + 1}. {question.questionText}</p>
                          
                          {question.questionType === "MCQ" && question.options && (
                            <div className="space-y-2">
                              {question.options.map((option) => (
                                <div 
                                  key={option.id}
                                  className={cn(
                                    "p-2 border rounded",
                                    option.id === question.correctOption && "border-green-500 bg-green-100",
                                    question.userAnswer === option.id && option.id !== question.correctOption && "border-red-500 bg-red-100",
                                    question.userAnswer !== option.id && option.id !== question.correctOption && "border-gray-200"
                                  )}
                                >
                                  <div className="flex items-start">
                                    <div className="w-6">{option.id.toUpperCase()}.</div>
                                    <div>{option.text}</div>
                                  </div>
                                </div>
                              ))}
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Your answer: </span>
                                {question.userAnswer ? question.userAnswer.toString().toUpperCase() : "Not answered"}
                              </div>
                              <div className="text-sm text-green-700">
                                <span className="font-medium">Correct answer: </span>
                                {question.correctOption?.toUpperCase()}
                              </div>
                            </div>
                          )}
                          
                          {question.questionType === "MSQ" && question.options && (
                            <div className="space-y-2">
                              {question.options.map((option) => {
                                const isCorrect = question.correctOptions?.includes(option.id);
                                const isSelected = Array.isArray(question.userAnswer) && question.userAnswer.includes(option.id);
                                
                                return (
                                  <div 
                                    key={option.id}
                                    className={cn(
                                      "p-2 border rounded",
                                      isCorrect && "border-green-500 bg-green-100",
                                      isSelected && !isCorrect && "border-red-500 bg-red-100",
                                      !isSelected && !isCorrect && "border-gray-200"
                                    )}
                                  >
                                    <div className="flex items-start">
                                      <div className="w-6">{option.id.toUpperCase()}.</div>
                                      <div>{option.text}</div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Your answer: </span>
                                {Array.isArray(question.userAnswer) && question.userAnswer.length > 0
                                  ? question.userAnswer.map(a => a.toUpperCase()).join(", ")
                                  : "Not answered"
                                }
                              </div>
                              <div className="text-sm text-green-700">
                                <span className="font-medium">Correct answer: </span>
                                {question.correctOptions && question.correctOptions.length > 0
                                  ? question.correctOptions.map(a => a.toUpperCase()).join(", ")
                                  : "None"
                                }
                              </div>
                            </div>
                          )}
                          
                          {question.questionType === "NAT" && (
                            <div className="space-y-2">
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Your answer: </span>
                                {question.userAnswer || "Not answered"}
                              </div>
                              <div className="text-sm text-green-700">
                                <span className="font-medium">Correct answer range: </span>
                                {/* Display range if available */}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Profile;

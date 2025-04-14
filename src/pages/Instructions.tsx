
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { TestType, TestParams } from "@/lib/types";
import { usePaper } from "@/context/PaperContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import TestLoading from "@/components/test/TestLoading";

interface SpecialTest {
  id: string;
  name: string;
  description?: string;
  duration: number;
  numQuestions: number;
  questions?: any[];
  [key: string]: any;
}

const Instructions = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { paperType } = usePaper();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testParams, setTestParams] = useState<TestParams | null>(null);
  const [specialTest, setSpecialTest] = useState<SpecialTest | null>(null);

  // Get test parameters from location state
  useEffect(() => {
    const params = location.state?.testParams;
    if (params) {
      setTestParams(params);
      
      // If it's a special test, fetch the test details
      if (params.testType === "SPECIAL" && params.specialTestId) {
        const fetchSpecialTest = async () => {
          try {
            const testRef = doc(db, "specialTests", params.specialTestId);
            const testDoc = await getDoc(testRef);
            
            if (testDoc.exists()) {
              const testData = { id: testDoc.id, ...testDoc.data() } as SpecialTest;
              
              // Validate that the test has questions
              if (!testData.questions || testData.questions.length === 0) {
                toast({
                  title: "Error",
                  description: "No questions found in this test.",
                  variant: "destructive",
                });
                navigate("/dashboard");
                return;
              }
              
              // Check if the user has already taken this test
              if (currentUser) {
                const responseQuery = query(
                  collection(db, "testResponses"),
                  where("userId", "==", currentUser.uid),
                  where("specialTestId", "==", params.specialTestId)
                );
                
                const responseSnapshot = await getDocs(responseQuery);
                if (!responseSnapshot.empty) {
                  toast({
                    title: "Test Already Taken",
                    description: "You have already attempted this test.",
                    variant: "destructive",
                  });
                  navigate("/dashboard");
                  return;
                }
              }
              
              setSpecialTest(testData);
            } else {
              toast({
                title: "Test Not Found",
                description: "The selected test could not be found.",
                variant: "destructive",
              });
              navigate("/dashboard");
            }
          } catch (error) {
            console.error("Error fetching special test:", error);
            toast({
              title: "Error",
              description: "Failed to load test. Please try again.",
              variant: "destructive",
            });
            navigate("/dashboard");
          } finally {
            setLoading(false);
          }
        };
        
        fetchSpecialTest();
      } else {
        setLoading(false);
      }
    } else {
      navigate("/dashboard");
    }
  }, [location.state, navigate, currentUser, toast]);

  const getTestTitle = () => {
    if (!testParams) return "Test";
    
    if (testParams.testType === "SPECIAL" && specialTest) {
      return specialTest.name;
    }
    
    if (testParams.testType === "PYQ") {
      return `${paperType} ${testParams.year} PYQ`;
    }
    
    if (testParams.testType === "FULL_SYLLABUS") {
      return "Full Syllabus Test";
    }
    
    if (testParams.testType === "SUBJECT_WISE") {
      return `${testParams.subject} Test`;
    }
    
    if (testParams.testType === "MULTI_SUBJECT") {
      return "Multi Subject Test";
    }
    
    return "Practice Test";
  };

  const getTestDescription = () => {
    if (!testParams) return "";
    
    if (testParams.testType === "SPECIAL" && specialTest) {
      return specialTest.description || "Special test";
    }
    
    if (testParams.testType === "PYQ") {
      return `Previous Year Question Paper - ${testParams.year}`;
    }
    
    if (testParams.testType === "SUBJECT_WISE") {
      return `Practice questions from ${testParams.subject}`;
    }
    
    if (testParams.testType === "MULTI_SUBJECT") {
      const subjects = testParams.subjects?.join(", ") || "Multiple subjects";
      return `Practice questions from ${subjects}`;
    }
    
    return "Practice test with questions from various subjects";
  };

  const getTestDuration = () => {
    if (!testParams) return 0;
    
    if (testParams.testType === "SPECIAL" && specialTest) {
      return specialTest.duration;
    }
    
    if (testParams.testType === "PYQ") {
      return 180; // 3 hours for PYQ
    }
    
    // For other test types
    return testParams.duration || 60;
  };

  const getQuestionCount = () => {
    if (!testParams) return 0;
    
    if (testParams.testType === "SPECIAL" && specialTest && specialTest.questions) {
      return specialTest.questions.length;
    }
    
    if (testParams.testType === "PYQ") {
      return 65; // Standard GATE paper has 65 questions
    }
    
    // For other test types
    return testParams.numQuestions || 0;
  };

  const getMarksText = () => {
    if (!testParams) return "";
    
    if (testParams.testType === "SPECIAL" && specialTest && specialTest.questions) {
      // Calculate total marks for special test
      const totalMarks = specialTest.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      return `${totalMarks} marks`;
    }
    
    if (testParams.testType === "PYQ") {
      return "100 marks"; // Standard GATE paper is 100 marks
    }
    
    return "Varies based on question difficulty";
  };

  const startTest = () => {
    if (testParams) {
      navigate("/test", { state: { testParams } });
    }
  };

  if (loading) {
    return <TestLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-10">
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto shadow-md">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800">{getTestTitle()}</h1>
                <p className="text-gray-600 mt-2">{getTestDescription()}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <h3 className="font-medium text-gray-500">Duration</h3>
                  <p className="text-xl font-semibold">{getTestDuration()} minutes</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Questions</h3>
                  <p className="text-xl font-semibold">{getQuestionCount()}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Total Marks</h3>
                  <p className="text-xl font-semibold">{getMarksText()}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Instructions</h2>
                <ul className="space-y-2 list-disc pl-5">
                  <li>Read all questions carefully before answering.</li>
                  <li>There may be negative marking for incorrect answers.</li>
                  <li>Once submitted, you cannot change your answers.</li>
                  <li>Do not reload or close the browser during the test.</li>
                  <li>The timer will start once you begin the test.</li>
                  <li>Click on the question number to navigate between questions.</li>
                  <li>Use the "Mark for Review" feature for questions you want to revisit.</li>
                </ul>
              </div>
              
              <div className="flex justify-center pt-4">
                <Button onClick={startTest} size="lg" className="px-8 py-6 text-lg">
                  Begin Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Instructions;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { usePaper } from "@/context/PaperContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Question } from "@/lib/types";

const Instructions = () => {
  const { year, testId } = useParams();
  const { paperType } = usePaper();
  const navigate = useNavigate();
  const [specialTest, setSpecialTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalMarks, setTotalMarks] = useState<number>(180); // Default for PYQ tests
  const [totalQuestions, setTotalQuestions] = useState<number>(65); // Default for PYQ tests

  // Fetch special test data if testId is provided
  useEffect(() => {
    const fetchSpecialTest = async () => {
      if (!testId) return;
      
      setLoading(true);
      try {
        console.log("Fetching special test with ID:", testId);
        const testDocRef = doc(db, "specialTests", testId);
        const testSnapshot = await getDoc(testDocRef);
        
        if (testSnapshot.exists()) {
          const testData = { id: testSnapshot.id, ...testSnapshot.data() };
          setSpecialTest(testData);
          
          // Calculate total marks and questions from embedded questions array
          if (testData.questions && Array.isArray(testData.questions) && testData.questions.length > 0) {
            let questionMarks = 0;
            testData.questions.forEach((question: Question) => {
              questionMarks += question.marks || 0;
            });
            
            console.log(`Total marks for special test: ${questionMarks} from ${testData.questions.length} questions`);
            setTotalMarks(questionMarks);
            setTotalQuestions(testData.questions.length);
          } else {
            console.error("No questions found in special test");
            setError("No questions found in this test");
            setTotalMarks(0);
            setTotalQuestions(0);
          }
        } else {
          console.error("Special test not found with ID:", testId);
          setError("Special test not found");
        }
      } catch (err) {
        console.error("Error fetching special test:", err);
        setError("Failed to load test data");
      } finally {
        setLoading(false);
      }
    };
    
    if (testId) {
      fetchSpecialTest();
    }
  }, [testId]);

  const handleStartTest = () => {
    if (testId) {
      navigate(`/test/special/${testId}`);
    } else if (year) {
      navigate(`/test/${year}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle className="text-center">Loading Test Information...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle className="text-center text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {specialTest ? specialTest.name : `${paperType} ${year} Test Instructions`}
          </CardTitle>
          {specialTest?.description && (
            <CardDescription className="text-center">
              {specialTest.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Details */}
          <div className="bg-indigo-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 text-center md:text-left">
              <p className="text-sm text-gray-500">Total Questions</p>
              <p className="font-medium text-lg">
                {specialTest ? totalQuestions : "65"}
              </p>
            </div>
            <div className="space-y-1 text-center md:text-left">
              <p className="text-sm text-gray-500">Total Time</p>
              <p className="font-medium text-lg">
                {specialTest ? `${specialTest.duration} minutes` : "3 hours"}
              </p>
            </div>
            <div className="space-y-1 text-center md:text-left">
              <p className="text-sm text-gray-500">Maximum Marks</p>
              <p className="font-medium text-lg">{totalMarks}</p>
            </div>
            <div className="space-y-1 text-center md:text-left">
              <p className="text-sm text-gray-500">Test Mode</p>
              <p className="font-medium text-lg">Online</p>
            </div>
          </div>

          <Separator />

          {/* General Instructions */}
          <div>
            <h3 className="font-semibold text-lg mb-3">General Instructions:</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>The test consists of multiple-choice questions (MCQs), multiple-select questions (MSQs), and numerical answer type (NAT) questions.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Each question has marks assigned to it, visible at the top right of the question.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Some questions may have negative marking. This will be indicated in the question.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>You can move freely between questions and review your answers before submitting.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Questions can be marked for review to revisit them later.</span>
              </li>
            </ul>
          </div>

          <Separator />

          {/* Important Notes */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Important Notes:</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500 shrink-0 mt-0.5" />
                <span>The test will automatically submit when the timer reaches zero.</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500 shrink-0 mt-0.5" />
                <span>Do not refresh or close the browser window during the test.</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500 shrink-0 mt-0.5" />
                <span>Ensure a stable internet connection before starting.</span>
              </li>
            </ul>
          </div>

          <Separator />

          {/* Declaration */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2">Declaration:</p>
            <p className="text-sm text-gray-700">
              I have read and understood all the instructions. I agree to follow them and take the test with integrity.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
          <Button onClick={handleStartTest}>
            Start Test
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Instructions;

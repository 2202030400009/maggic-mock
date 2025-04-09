
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Award } from "lucide-react"; 
import ResultHeader from "@/components/result/ResultHeader";
import ResultSummaryCards from "@/components/result/ResultSummaryCards";
import SubjectPerformance from "@/components/result/SubjectPerformance";
import WeakSubjects from "@/components/result/WeakSubjects";
import QuestionAnalysisTable from "@/components/result/QuestionAnalysisTable";
import { QuestionDetail, TestResult } from "@/types/result";
import { Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Result = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionDetails, setQuestionDetails] = useState<QuestionDetail[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load test results from session storage
    const storedResults = sessionStorage.getItem('testResults');
    
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
        console.log("Loaded results:", parsedResults); // Debug log
        
        // Process questions for the table
        if (parsedResults.questions && parsedResults.userAnswers) {
          const details = parsedResults.questions.map((q: Question, index: number) => {
            const userAnswer = parsedResults.userAnswers?.[index];
            const questionStatus = parsedResults.questionStatus?.[index] || "notVisited";
            
            // Determine if the question was skipped based on status and answer
            let isSkipped = questionStatus === "skipped" || questionStatus === "skippedReview" || 
                           questionStatus === "notVisited" ||
                           userAnswer === null || 
                           (typeof userAnswer === "string" && userAnswer.trim() === "") || 
                           (Array.isArray(userAnswer) && userAnswer.length === 0);
            
            // Check if the question was marked as attempted in the status
            if (questionStatus === "attempted" || questionStatus === "attemptedReview") {
              isSkipped = false;
            }
            
            let isCorrect = false;
            
            // Only check for correctness if the question wasn't skipped
            if (!isSkipped) {
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
            }
            
            console.log(`Question ${index+1}: status=${questionStatus}, isSkipped=${isSkipped}, isCorrect=${isCorrect}`); // Debug log
            
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
        toast({
          title: "Error",
          description: "Failed to load test results",
          variant: "destructive"
        });
      }
    }
    
    setLoading(false);
  }, [toast]);

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
      <ResultHeader />

      <main className="container mx-auto px-4 py-8">
        <ResultSummaryCards 
          rawMarks={results?.rawMarks || 0}
          lossMarks={results?.lossMarks || 0}
          scaledMarks={results?.scaledMarks || 0}
          totalMarks={results?.totalMarks || 0}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1">
            <WeakSubjects weakSubjects={results?.weakSubjects || []} />
          </div>
          
          <div className="md:col-span-2">
            <SubjectPerformance subjectPerformance={results?.subjectPerformance || []} />
          </div>
        </div>

        <QuestionAnalysisTable questionDetails={questionDetails} />

        <div className="flex justify-center mt-8">
          <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
        </div>
      </main>
    </div>
  );
};

export default Result;

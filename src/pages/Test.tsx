
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePaper } from "@/context/PaperContext";
import { cn } from "@/lib/utils";
import { Flag, ArrowRight, CheckCircle, XCircle } from "lucide-react";

// Mock question for demo
const mockQuestion = {
  id: "q1",
  text: "Which of the following sorting algorithms has the best time complexity in the worst case scenario?",
  options: [
    { id: "a", text: "Quick Sort" },
    { id: "b", text: "Merge Sort" },
    { id: "c", text: "Bubble Sort" },
    { id: "d", text: "Selection Sort" }
  ],
  marks: 2
};

// Status colors for question palette
const statusColors = {
  notVisited: "bg-gray-200",
  attempted: "bg-green-500 text-white",
  skipped: "bg-red-500 text-white",
  attemptedReview: "bg-purple-500 text-white",
  skippedReview: "bg-orange-500 text-white"
};

const Test = () => {
  const { year } = useParams<{ year: string }>();
  const { paperType } = usePaper();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [markedForReview, setMarkedForReview] = useState(false);
  const [questionStatus, setQuestionStatus] = useState<Record<number, string>>(
    Array(65).fill(0).reduce((acc, _, index) => ({ ...acc, [index]: "notVisited" }), {})
  );

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        const confirmExit = window.confirm("Are you sure you want to exit the test?");
        if (confirmExit) {
          navigate("/dashboard");
        } else {
          try {
            document.documentElement.requestFullscreen();
          } catch (error) {
            console.error("Fullscreen request failed:", error);
          }
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [navigate]);

  const updateQuestionStatus = (status: string) => {
    setQuestionStatus(prev => ({
      ...prev,
      [currentQuestion]: status
    }));
  };

  const handleNextQuestion = () => {
    // Update status based on actions
    if (selectedOption) {
      updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
    } else {
      updateQuestionStatus(markedForReview ? "skippedReview" : "skipped");
    }

    // Move to next question or submit if last
    if (currentQuestion === 64) {
      handleSubmitTest();
    } else {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setMarkedForReview(false);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    if (selectedOption) {
      updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
    } else if (questionStatus[currentQuestion] !== "notVisited") {
      updateQuestionStatus(markedForReview ? "skippedReview" : "skipped");
    }

    setCurrentQuestion(index);
    setSelectedOption(null);
    setMarkedForReview(false);
  };

  const handleSubmitTest = () => {
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    navigate("/result");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "attempted":
        return <CheckCircle className="h-3 w-3" />;
      case "skipped":
        return <XCircle className="h-3 w-3" />;
      case "attemptedReview":
      case "skippedReview":
        return <Flag className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-bold">{paperType} {year}</h1>
          <div className="flex space-x-4">
            <div className="bg-indigo-100 px-3 py-1 rounded text-sm font-medium">
              Question {currentQuestion + 1}/65
            </div>
            <div className="bg-red-100 px-3 py-1 rounded text-sm font-medium">
              Time: 03:00:00
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Question Panel */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-500">
                Question {currentQuestion + 1} • {mockQuestion.marks} mark{mockQuestion.marks > 1 ? 's' : ''}
              </span>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs",
                  markedForReview && "bg-amber-50 border-amber-300 text-amber-700"
                )}
                onClick={() => setMarkedForReview(!markedForReview)}
              >
                <Flag className={cn("h-3 w-3 mr-1", markedForReview ? "text-amber-500" : "text-gray-400")} />
                {markedForReview ? "Marked for Review" : "Mark for Review"}
              </Button>
            </div>

            <h2 className="text-lg font-medium mb-6">{mockQuestion.text}</h2>

            <div className="space-y-3">
              {mockQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "border rounded-md p-3 cursor-pointer transition-colors",
                    selectedOption === option.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <div className="flex items-center">
                    <div className={cn(
                      "w-6 h-6 rounded-full border flex items-center justify-center mr-3",
                      selectedOption === option.id 
                        ? "border-indigo-500 bg-indigo-500 text-white" 
                        : "border-gray-300"
                    )}>
                      {option.id.toUpperCase()}
                    </div>
                    <span>{option.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  updateQuestionStatus("skipped");
                  if (currentQuestion < 64) {
                    setCurrentQuestion(prev => prev + 1);
                    setSelectedOption(null);
                    setMarkedForReview(false);
                  }
                }}
              >
                Skip
              </Button>
              
              <Button onClick={handleNextQuestion} className="bg-indigo-600 hover:bg-indigo-700">
                {currentQuestion === 64 ? "Submit Test" : "Save & Next"}
                {currentQuestion !== 64 && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="w-72 bg-white shadow-lg p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-3">Question Palette</h3>
          
          <div className="mb-4 flex flex-wrap gap-1">
            {Array(65).fill(0).map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-8 h-8 text-xs font-medium rounded flex items-center justify-center",
                  statusColors[questionStatus[index] as keyof typeof statusColors]
                )}
                onClick={() => handleJumpToQuestion(index)}
              >
                {index + 1}
                {getStatusIcon(questionStatus[index])}
              </button>
            ))}
          </div>

          <div className="border-t pt-3">
            <div className="text-xs font-medium mb-1">Legend:</div>
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(statusColors).map(([key, color]) => (
                <div key={key} className="flex items-center text-xs">
                  <div className={cn("w-4 h-4 rounded mr-2", color)}></div>
                  <span className="capitalize">
                    {key === "notVisited" ? "Not Visited" : 
                     key === "attemptedReview" ? "Attempted & Marked" : 
                     key === "skippedReview" ? "Skipped & Marked" : 
                     key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;

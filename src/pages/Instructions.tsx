
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { usePaper } from "@/context/PaperContext";
import { BookOpen, AlertTriangle } from "lucide-react";

const Instructions = () => {
  const [accepted, setAccepted] = useState(false);
  const { year } = useParams<{ year: string }>();
  const { paperType } = usePaper();
  const navigate = useNavigate();

  const startTest = () => {
    if (!accepted) return;
    
    try {
      document.documentElement.requestFullscreen();
      navigate(`/test/${year}`);
    } catch (error) {
      console.error("Fullscreen failed:", error);
      navigate(`/test/${year}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-bold">MaggicMock</h1>
          </div>
          <span className="text-sm font-medium text-gray-700">{paperType}</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            {paperType} {year} - Test Instructions
          </h2>

          <div className="space-y-4 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-amber-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg">Before you begin:</h3>
                <p className="text-gray-700">
                  The test will run in fullscreen mode. Exiting fullscreen will prompt a confirmation dialog.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="font-semibold mb-2">Test Details:</h3>
              <ul className="space-y-1 text-gray-700">
                <li>• Total Questions: 65</li>
                <li>• Total Marks: 180</li>
                <li>• Time: 3 hours (180 minutes)</li>
                <li>• Negative Marking: 1/3 for 1 mark questions, 2/3 for 2 mark questions</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Navigation and Marking:</h3>
              <ul className="space-y-1 text-gray-700">
                <li>• You can attempt questions in any order using the question palette.</li>
                <li>• Questions can be marked for review and revisited later.</li>
                <li>• Color coding indicates the status of each question (attempted, skipped, etc.)</li>
                <li>• Only attempted questions (including those marked for review) will be evaluated.</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-6">
            <Checkbox 
              id="terms" 
              checked={accepted} 
              onCheckedChange={(checked) => setAccepted(checked === true)}
            />
            <label 
              htmlFor="terms" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have read and understood the instructions
            </label>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
            <Button 
              onClick={startTest} 
              disabled={!accepted}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Start Test
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Instructions;

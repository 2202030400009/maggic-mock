
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface TestTypeSelectionProps {
  testType: string | null;
  setTestType: (type: string) => void;
  onNext: () => void;
}

const TestTypeSelection = ({ testType, setTestType, onNext }: TestTypeSelectionProps) => {
  return (
    <div className="text-center space-y-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800">
        What type of test would you like to generate?
      </h2>
      
      <div className="grid gap-4">
        {["Full Syllabus", "Subject Wise", "Multi-Subject Test"].map((type) => (
          <Button
            key={type}
            variant={testType === type ? "default" : "outline"}
            className={`w-full py-6 text-lg ${testType === type ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
            onClick={() => setTestType(type)}
          >
            {type}
          </Button>
        ))}
      </div>
      
      <Button
        className="bg-indigo-600 hover:bg-indigo-700 w-full"
        size="lg"
        disabled={!testType}
        onClick={onNext}
      >
        Next <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
};

export default TestTypeSelection;

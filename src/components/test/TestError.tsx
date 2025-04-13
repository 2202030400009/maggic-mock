
import React from "react";
import { Button } from "@/components/ui/button";

interface TestErrorProps {
  error: string;
  onBackToDashboard: () => void;
}

const TestError: React.FC<TestErrorProps> = ({ error, onBackToDashboard }) => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2 text-red-600">Test Error</h2>
        <p>{error}</p>
        <Button
          onClick={onBackToDashboard}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default TestError;

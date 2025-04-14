
import React from "react";
import { Loader2 } from "lucide-react";

const TestLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center p-8 rounded-lg bg-white shadow-sm max-w-md w-full">
        <div className="flex justify-center mb-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-3 text-gray-800">Loading Test...</h2>
        <p className="text-gray-600">Please wait while we prepare your test questions.</p>
        <div className="mt-6 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 animate-pulse rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default TestLoading;

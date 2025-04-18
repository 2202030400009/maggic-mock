
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ResultHeader = () => {
  const navigate = useNavigate();
  
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center">
          <Award className="h-5 w-5 mr-2 text-indigo-600" />
          Test Results
        </h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={() => navigate("/profile")}
          >
            <User className="h-4 w-4 mr-1" /> Profile
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
        </div>
      </div>
    </header>
  );
};

export default ResultHeader;

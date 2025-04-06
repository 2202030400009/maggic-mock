
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePaper } from "@/context/PaperContext";
import { useToast } from "@/hooks/use-toast";
import { FullSyllabusFormValues } from "@/components/test/FullSyllabusForm";
import { SubjectWiseFormValues } from "@/components/test/SubjectWiseForm";
import { MultiSubjectFormValues } from "@/components/test/MultiSubjectForm";
import { gateCSSubjects, gateDASubjects } from "@/constants/subjects";
import { 
  generateFullSyllabusTest,
  generateSubjectWiseTest,
  generateMultiSubjectTest 
} from "@/services/testService";
import TestTypeSelection from "@/components/test/TestTypeSelection";
import FullSyllabusForm from "@/components/test/FullSyllabusForm";
import SubjectWiseForm from "@/components/test/SubjectWiseForm";
import MultiSubjectForm from "@/components/test/MultiSubjectForm";

const CreateTest = () => {
  const navigate = useNavigate();
  const { paperType } = usePaper();
  const { toast } = useToast();
  
  const [step, setStep] = useState(0);
  const [testType, setTestType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const subjectList = paperType === "GATE CS" ? gateCSSubjects : gateDASubjects;
  
  // Handle full syllabus form submission
  const handleFullSyllabusSubmit = async (values: FullSyllabusFormValues) => {
    setLoading(true);
    
    try {
      const numQuestions = values.numQuestions; // Already transformed by zod
      const duration = values.duration; // Already transformed by zod
      
      const testParams = await generateFullSyllabusTest(paperType || "", numQuestions, duration);
      
      if (!testParams) {
        showNoQuestionsToast();
        setLoading(false);
        return;
      }
      
      navigateToTest(testParams);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle subject wise form submission
  const handleSubjectWiseSubmit = async (values: SubjectWiseFormValues) => {
    setLoading(true);
    
    try {
      const numQuestions = values.numQuestions; // Already transformed by zod
      const duration = values.duration; // Already transformed by zod
      
      const testParams = await generateSubjectWiseTest(
        paperType || "", 
        values.subject,
        numQuestions,
        duration
      );
      
      if (!testParams) {
        showNoQuestionsToast();
        setLoading(false);
        return;
      }
      
      navigateToTest(testParams);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle multi-subject form submission
  const handleMultiSubjectSubmit = async (values: MultiSubjectFormValues) => {
    setLoading(true);
    
    try {
      const numQuestions = values.numQuestions; // Already transformed by zod
      const duration = values.duration; // Already transformed by zod
      
      const testParams = await generateMultiSubjectTest(
        paperType || "",
        values.subjects || [],
        numQuestions,
        duration
      );
      
      if (!testParams) {
        showNoQuestionsToast();
        setLoading(false);
        return;
      }
      
      navigateToTest(testParams);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Common error handling function
  const handleError = (error: any) => {
    console.error("Error generating test:", error);
    toast({
      title: "Error",
      description: "Failed to generate test. Please try again.",
      variant: "destructive",
    });
    setLoading(false);
  };
  
  // Show toast for no questions found
  const showNoQuestionsToast = () => {
    toast({
      title: "No questions found",
      description: "No questions are available for your selected criteria. Please try different options.",
      variant: "destructive",
    });
  };
  
  // Navigate to test with parameters
  const navigateToTest = (testParams: any) => {
    sessionStorage.setItem('testParams', JSON.stringify(testParams));
    navigate('/test/personalized');
  };

  // Render current step content
  const renderStep = () => {
    if (step === 0) {
      return (
        <TestTypeSelection 
          testType={testType} 
          setTestType={setTestType} 
          onNext={() => setStep(1)} 
        />
      );
    } else if (step === 1) {
      if (testType === "Full Syllabus") {
        return (
          <FullSyllabusForm
            onSubmit={handleFullSyllabusSubmit}
            onBack={() => setStep(0)}
            loading={loading}
          />
        );
      } else if (testType === "Subject Wise") {
        return (
          <SubjectWiseForm
            onSubmit={handleSubjectWiseSubmit}
            onBack={() => setStep(0)}
            loading={loading}
            subjectList={subjectList}
          />
        );
      } else if (testType === "Multi-Subject Test") {
        return (
          <MultiSubjectForm
            onSubmit={handleMultiSubjectSubmit}
            onBack={() => setStep(0)}
            loading={loading}
            subjectList={subjectList}
          />
        );
      }
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Create Personalized Test</h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            {renderStep()}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateTest;

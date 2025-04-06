
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePaper } from "@/context/PaperContext";
import { useToast } from "@/hooks/use-toast";
import { TestParams } from "@/lib/types";
import { fetchQuestions, shuffleArray } from "@/utils/test-utils";
import TestTypeSelection from "@/components/test/TestTypeSelection";
import FullSyllabusForm, { FullSyllabusFormValues } from "@/components/test/FullSyllabusForm";
import SubjectWiseForm, { SubjectWiseFormValues } from "@/components/test/SubjectWiseForm";
import MultiSubjectForm, { MultiSubjectFormValues } from "@/components/test/MultiSubjectForm";

// GATE CS Subjects
const gateCSSubjects = [
  "Aptitude",
  "Engineering Maths",
  "Discrete Maths",
  "Digital Logic",
  "Computer Organization and Architecture",
  "Programming and Data Structures",
  "Algorithms",
  "Theory of Computation",
  "Compiler Design",
  "Operating System",
  "Database",
  "Computer Networking",
];

// GATE DA Subjects
const gateDASubjects = [
  "Aptitude",
  "Linear Algebra",
  "Calculus",
  "Probability & Statistics",
  "Programming and Data Structures",
  "Algorithms",
  "Database & Warehousing",
  "Artificial Intelligence",
  "Machine Learning",
  "Deep Learning",
];

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
      const numQuestions = Number(values.numQuestions);
      const duration = Number(values.duration);
      
      const questions = await fetchQuestions("Full Syllabus", paperType || "", {});
      await processQuestions(questions, numQuestions, duration, "Full Syllabus");
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
      const numQuestions = Number(values.numQuestions);
      const duration = Number(values.duration);
      
      const questions = await fetchQuestions("Subject Wise", paperType || "", { 
        subject: values.subject 
      });
      await processQuestions(questions, numQuestions, duration, "Subject Wise");
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
      const numQuestions = Number(values.numQuestions);
      const duration = Number(values.duration);
      
      const questions = await fetchQuestions("Multi-Subject Test", paperType || "", {
        subjects: values.subjects
      });
      await processQuestions(questions, numQuestions, duration, "Multi-Subject Test");
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
  };
  
  // Common function to process questions and navigate
  const processQuestions = async (
    questions: any[], 
    numQuestions: number,
    duration: number, 
    selectedTestType: string
  ) => {
    if (questions.length === 0) {
      toast({
        title: "No questions found",
        description: "No questions are available for your selected criteria. Please try different options.",
        variant: "destructive",
      });
      return;
    }
    
    const shuffledQuestions = shuffleArray(questions);
    const selectedQuestions = shuffledQuestions.slice(0, numQuestions);
    
    if (selectedQuestions.length < numQuestions) {
      toast({
        title: "Warning",
        description: `Only ${selectedQuestions.length} questions are available for your selection. Proceeding with those.`,
        variant: "default",
      });
    }
    
    const testParams: TestParams = {
      questions: selectedQuestions,
      duration: duration,
      testType: selectedTestType
    };
    
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

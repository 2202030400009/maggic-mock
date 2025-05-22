import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { z } from "zod";
import { usePaper } from "@/context/PaperContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import PaperSwitcher from "@/components/PaperSwitcher";
import QuestionForm from "@/components/admin/specialTests/QuestionForm";
import QuestionPreview from "@/components/admin/specialTests/QuestionPreview";
import TestInfoCard from "@/components/admin/specialTests/TestInfoCard";
import { Question } from "@/lib/types";

// Define SpecialTest interface for type safety
interface SpecialTest {
  id: string;
  name?: string;
  description?: string;
  numQuestions?: number;
  duration?: number;
  questions?: Question[];
  [key: string]: any; // For any other properties
}

const formSchema = z.object({
  questionType: z.string(),
  questionText: z.string().min(1, "Question text is required"),
  imageUrl: z.string().optional(),
  options: z.array(z.string()).optional(),
  correctOption: z.string().optional(),
  correctOptions: z.array(z.string()).optional(),
  rangeStart: z.string().optional(),
  rangeEnd: z.string().optional(),
  marks: z.string(),
  subject: z.string(),
  negativeMark: z.number().optional(),
  difficultyLevel: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

const SpecialTestAddQuestions = () => {
  const { testId } = useParams();
  const { paperType } = usePaper();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testData, setTestData] = useState<SpecialTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [questionLimitReached, setQuestionLimitReached] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        if (!testId) return;
        
        const testDocRef = doc(db, "specialTests", testId);
        const testSnapshot = await getDoc(testDocRef);
        
        if (testSnapshot.exists()) {
          const data: SpecialTest = { 
            id: testSnapshot.id, 
            ...testSnapshot.data() as Omit<SpecialTest, 'id'>
          };
          setTestData(data);
          
          const questionCount = data.questions?.length || 0;
          const questionLimit = data.numQuestions || 0;
          setQuestionLimitReached(questionCount >= questionLimit);
        } else {
          toast({
            title: "Error",
            description: "Special test not found",
            variant: "destructive",
          });
          navigate("/admin");
        }
      } catch (error) {
        console.error("Error fetching test data:", error);
        toast({
          title: "Error",
          description: "Failed to load test data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestData();
  }, [testId, navigate]);

  const handlePreview = (data: FormData) => {
    setFormData(data);
    setPreviewOpen(true);
  };

  const calculateNegativeMarks = () => {
    if (!formData) return 0;
    
    if (formData.questionType === "MCQ") {
      return formData.marks === "1" ? -0.33 : -0.66;
    } else {
      return 0;
    }
  };

  const handleSubmit = async () => {
    if (!testId || !formData || !testData || isSubmitDisabled) return;
    
    // Disable the submit button to prevent multiple submissions
    setIsSubmitDisabled(true);
    
    try {
      setIsSubmitting(true);
      
      // Check if question limit is reached
      const currentQuestionCount = testData?.questions?.length || 0;
      const questionLimit = testData?.numQuestions || 0;
      
      if (currentQuestionCount >= questionLimit) {
        toast({
          title: "Limit Reached",
          description: `You cannot add more than ${questionLimit} questions to this test.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        setIsSubmitDisabled(false);
        return;
      }
      
      // Validate form data based on question type
      if (formData.questionType === "MCQ" || formData.questionType === "MSQ") {
        const filledOptions = (formData.options || []).filter(opt => opt.trim() !== "");
        if (filledOptions.length < 2) {
          toast({
            title: "Error",
            description: "At least two options are required",
            variant: "destructive",
          });
          setIsSubmitting(false);
          setIsSubmitDisabled(false);
          return;
        }
        
        if (formData.questionType === "MCQ" && !formData.correctOption) {
          toast({
            title: "Error",
            description: "Please select a correct option",
            variant: "destructive",
          });
          setIsSubmitting(false);
          setIsSubmitDisabled(false);
          return;
        }
        
        if (formData.questionType === "MSQ" && (!formData.correctOptions || formData.correctOptions.length === 0)) {
          toast({
            title: "Error",
            description: "Please select at least one correct option",
            variant: "destructive",
          });
          setIsSubmitting(false);
          setIsSubmitDisabled(false);
          return;
        }
      }
      
      if (formData.questionType === "NAT" && (!formData.rangeStart || !formData.rangeEnd)) {
        toast({
          title: "Error",
          description: "Please provide both range values for NAT question",
          variant: "destructive",
        });
        setIsSubmitting(false);
        setIsSubmitDisabled(false);
        return;
      }
      
      const negativeMark = calculateNegativeMarks();
      
      const questionObj: any = {
        text: formData.questionText,
        type: formData.questionType,
        marks: parseInt(formData.marks),
        negativeMark,
        subject: formData.subject,
        paperType,
        addedBy: currentUser?.email || "unknown",
        difficultyLevel: formData.difficultyLevel || 3,
      };
      
      if (formData.imageUrl) {
        questionObj.imageUrl = formData.imageUrl;
      }
      
      if (formData.questionType === "MCQ" || formData.questionType === "MSQ") {
        const validOptions = (formData.options || [])
          .filter(opt => opt.trim() !== "")
          .map((text, i) => ({ id: String.fromCharCode(97 + i), text })); // a, b, c, d
          
        questionObj.options = validOptions;
        
        if (formData.questionType === "MCQ") {
          questionObj.correctOption = formData.correctOption;
        } else {
          questionObj.correctOptions = formData.correctOptions;
        }
      } else if (formData.questionType === "NAT") {
        questionObj.rangeStart = parseFloat(formData.rangeStart || "0");
        questionObj.rangeEnd = parseFloat(formData.rangeEnd || "0");
      }
      
      // Check for duplicate questions
      const questionText = formData.questionText.trim();
      const existingQuestions = testData?.questions || [];
      const similarQuestion = existingQuestions.find(
        (q: any) => q.text && q.text.trim() === questionText
      );
      
      if (similarQuestion) {
        toast({
          title: "Duplicate Question",
          description: "This question already exists in the test.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        setIsSubmitDisabled(false);
        return;
      }
      
      // Add to general questions collection
      const generalQuestionRef = await addDoc(collection(db, "questions"), questionObj);
      
      // Add to special test
      const testDocRef = doc(db, "specialTests", testId);
      await updateDoc(testDocRef, {
        questions: arrayUnion({
          id: generalQuestionRef.id,
          ...questionObj
        })
      });
      
      // Reset form
      setFormData(null);
      setPreviewOpen(false);
      
      toast({
        title: "Success",
        description: "Question added successfully",
      });
      
      // Update local state
      const updatedQuestions = [
        ...(testData.questions || []),
        { id: generalQuestionRef.id, ...questionObj }
      ];
      
      const updatedTestData = {
        ...testData,
        questions: updatedQuestions
      };
      
      setTestData(updatedTestData);
      
      // Check if limit reached
      if (updatedQuestions.length >= questionLimit) {
        setQuestionLimitReached(true);
        toast({
          title: "Question Limit Reached",
          description: `You've added the maximum number of questions (${questionLimit}) to this test.`,
        });
      }
      
    } catch (error) {
      console.error("Error adding question:", error);
      toast({
        title: "Error",
        description: "Failed to add question",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      // Re-enable submit button after a short delay
      setTimeout(() => {
        setIsSubmitDisabled(false);
      }, 1000);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-10 text-center">Loading test data...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">Add Questions to {testData?.name}</h1>
          <Badge variant="outline" className="text-lg">
            {paperType}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <PaperSwitcher />
          <Button onClick={() => navigate("/admin/special-tests")}>Back to Tests</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {questionLimitReached ? (
            <Alert className="mb-6 border-yellow-400 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle>Question Limit Reached</AlertTitle>
              <AlertDescription>
                You've added the maximum number of {testData?.numQuestions} questions to this test.
                <div className="mt-2">
                  <Button onClick={() => navigate("/admin/special-tests")}>
                    Back to Tests
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Add New Question</CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionForm 
                  paperType={paperType || "GATE CS"}
                  onPreview={handlePreview}
                  onCancel={() => navigate("/admin/special-tests")}
                />
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <TestInfoCard 
            name={testData?.name || ""}
            description={testData?.description}
            questionCount={testData?.questions?.length || 0}
            questionLimit={testData?.numQuestions || 0}
            duration={testData?.duration || 0}
            isLimitReached={questionLimitReached}
          />
        </div>
      </div>

      {formData && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Question Preview</DialogTitle>
              <DialogDescription>
                Review the question before adding it to the test
              </DialogDescription>
            </DialogHeader>
            
            <QuestionPreview 
              questionType={formData.questionType}
              questionText={formData.questionText}
              imageUrl={formData.imageUrl || ""}
              options={formData.options}
              correctOption={formData.correctOption}
              correctOptions={formData.correctOptions}
              rangeStart={formData.rangeStart}
              rangeEnd={formData.rangeEnd}
              subject={formData.subject}
              marks={formData.marks}
              negativeMark={calculateNegativeMarks()}
              difficultyLevel={formData.difficultyLevel || 3}
              onSave={handleSubmit}
              onEdit={() => setPreviewOpen(false)}
              isSubmitting={isSubmitting || isSubmitDisabled}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SpecialTestAddQuestions;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePaper } from "@/context/PaperContext";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Question, TestParams } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

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

// Define form schemas with proper transformations to handle string-to-number conversions
// Schema for Full Syllabus form with proper transformations
const FullSyllabusSchema = z.object({
  // Transform string input values to numbers before validation
  numQuestions: z
    .string()
    .min(1, "Required")
    .transform((val) => Number(val) || 0),
  duration: z
    .string()
    .min(1, "Required")
    .transform((val) => Number(val) || 0),
});

// Properly typed form values derived from schema
type FullSyllabusFormValues = z.infer<typeof FullSyllabusSchema>;

// Schema for Subject Wise form with proper transformations
const SubjectWiseSchema = z.object({
  subject: z.string(),
  // Transform string input values to numbers before validation
  numQuestions: z
    .string()
    .min(1, "Required")
    .transform((val) => Number(val) || 0),
  duration: z
    .string()
    .min(1, "Required")
    .transform((val) => Number(val) || 0),
});

// Properly typed form values derived from schema
type SubjectWiseFormValues = z.infer<typeof SubjectWiseSchema>;

// Schema for Multi-Subject form with proper transformations
const MultiSubjectSchema = z.object({
  // Transform string input values to numbers before validation
  numSubjects: z
    .string()
    .min(1, "Required")
    .transform((val) => Number(val) || 0),
  subjects: z.array(z.string()).optional(),
  numQuestions: z
    .string()
    .min(1, "Required")
    .transform((val) => Number(val) || 0),
  duration: z
    .string()
    .min(1, "Required")
    .transform((val) => Number(val) || 0),
});

// Properly typed form values derived from schema
type MultiSubjectFormValues = z.infer<typeof MultiSubjectSchema>;

const CreateTest = () => {
  const navigate = useNavigate();
  const { paperType } = usePaper();
  const { toast } = useToast();
  
  const [step, setStep] = useState(0);
  const [testType, setTestType] = useState<string | null>(null);
  const [numSubjects, setNumSubjects] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  
  const subjectList = paperType === "GATE CS" ? gateCSSubjects : gateDASubjects;
  
  // Forms for different test types - Using string default values for form inputs and ensuring types are handled correctly
  const fullSyllabusForm = useForm<FullSyllabusFormValues>({
    resolver: zodResolver(FullSyllabusSchema),
    defaultValues: {
      // Using string values for input fields as they expect strings
      numQuestions: "65",
      duration: "180",
    },
  });
  
  const subjectWiseForm = useForm<SubjectWiseFormValues>({
    resolver: zodResolver(SubjectWiseSchema),
    defaultValues: {
      subject: subjectList[0],
      // Using string values for input fields as they expect strings
      numQuestions: "20",
      duration: "60",
    },
  });
  
  const multiSubjectForm = useForm<MultiSubjectFormValues>({
    resolver: zodResolver(MultiSubjectSchema),
    defaultValues: {
      // Using string values for input fields as they expect strings
      numSubjects: "2",
      subjects: [subjectList[0], subjectList[1]],
      numQuestions: "30",
      duration: "90",
    },
  });
  
  // Update form based on number of subjects
  useEffect(() => {
    if (testType === "Multi-Subject Test") {
      const subjects = multiSubjectForm.getValues("subjects") || [];
      const numSubjectsVal = Number(multiSubjectForm.getValues("numSubjects")); // Ensure numSubjects is a number
      
      // Make sure numSubjects is updated with the correct numeric value
      if (numSubjectsVal !== numSubjects) {
        setNumSubjects(numSubjectsVal);
      }
      
      // Adjust subjects array based on numSubjects
      if (subjects.length !== numSubjects) {
        const newSubjects = [...subjects];
        if (newSubjects.length < numSubjects) {
          // Add more subjects
          while (newSubjects.length < numSubjects) {
            const availableSubjects = subjectList.filter(
              subject => !newSubjects.includes(subject)
            );
            if (availableSubjects.length > 0) {
              newSubjects.push(availableSubjects[0]);
            } else {
              break;
            }
          }
        } else {
          // Remove excess subjects
          newSubjects.splice(numSubjects);
        }
        multiSubjectForm.setValue("subjects", newSubjects);
      }
    }
  }, [numSubjects, testType, multiSubjectForm, subjectList]);
  
  // Function to fetch questions from Firestore with proper type handling
  const fetchQuestions = async (
    type: string, 
    params: Record<string, any>
  ): Promise<Question[]> => {
    try {
      let q;
      
      if (type === "Full Syllabus") {
        q = query(
          collection(db, "questions"),
          where("paperType", "==", paperType)
        );
      } else if (type === "Subject Wise") {
        q = query(
          collection(db, "questions"),
          where("paperType", "==", paperType),
          where("subject", "==", params.subject)
        );
      } else if (type === "Multi-Subject Test") {
        q = query(
          collection(db, "questions"),
          where("paperType", "==", paperType),
          where("subject", "in", params.subjects)
        );
      } else {
        return [];
      }
      
      const querySnapshot = await getDocs(q);
      const questions: Question[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        // Properly converting document data to Question type with explicit type assertions
        questions.push({ 
          id: doc.id, 
          text: data.text as string,
          type: data.type as "MCQ" | "MSQ" | "NAT",
          options: data.options as { id: string; text: string }[],
          correctOption: data.correctOption as string | undefined,
          correctOptions: data.correctOptions as string[] | undefined,
          rangeStart: data.rangeStart as number | undefined,
          rangeEnd: data.rangeEnd as number | undefined,
          imageUrl: data.imageUrl as string | undefined,
          marks: data.marks as number,
          negativeMark: data.negativeMark as number,
          subject: data.subject as string
        });
      });
      
      return questions;
    } catch (error) {
      console.error("Error fetching questions:", error);
      throw error;
    }
  };
  
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  // Function to generate test with proper type handling
  const generateTest = async () => {
    setLoading(true);
    
    try {
      let questions: Question[] = [];
      let numQuestions = 0;
      let duration = 0;
      let selectedTestType = testType || "";
      
      if (testType === "Full Syllabus") {
        // Get values from form and ensure they're numbers through schema transformation
        const values = fullSyllabusForm.getValues();
        numQuestions = Number(values.numQuestions); // Ensure it's a number
        duration = Number(values.duration); // Ensure it's a number
        
        // Fetch all questions for this paper type
        questions = await fetchQuestions(testType, {});
      } else if (testType === "Subject Wise") {
        // Get values from form and ensure they're numbers through schema transformation
        const values = subjectWiseForm.getValues();
        numQuestions = Number(values.numQuestions); // Ensure it's a number
        duration = Number(values.duration); // Ensure it's a number
        
        // Fetch questions for the selected subject
        questions = await fetchQuestions(testType, { subject: values.subject });
      } else if (testType === "Multi-Subject Test") {
        // Get values from form and ensure they're numbers through schema transformation
        const values = multiSubjectForm.getValues();
        numQuestions = Number(values.numQuestions); // Ensure it's a number
        duration = Number(values.duration); // Ensure it's a number
        
        // Fetch questions for selected subjects
        questions = await fetchQuestions(testType, { subjects: values.subjects });
      }
      
      if (questions.length === 0) {
        toast({
          title: "No questions found",
          description: "No questions are available for your selected criteria. Please try different options.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Shuffle questions and select the required number
      const shuffledQuestions = shuffleArray(questions);
      const selectedQuestions = shuffledQuestions.slice(0, numQuestions);
      
      if (selectedQuestions.length < numQuestions) {
        toast({
          title: "Warning",
          description: `Only ${selectedQuestions.length} questions are available for your selection. Proceeding with those.`,
          variant: "default",
        });
      }
      
      // Create test parameters object with properly typed values
      const testParams: TestParams = {
        questions: selectedQuestions,
        duration: duration, // Explicitly a number
        testType: selectedTestType // String
      };
      
      // Store test parameters in session storage
      sessionStorage.setItem('testParams', JSON.stringify(testParams));
      
      // Redirect to test page
      navigate('/test/personalized');
    } catch (error) {
      console.error("Error generating test:", error);
      toast({
        title: "Error",
        description: "Failed to generate test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const renderStep = () => {
    if (step === 0) {
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
            onClick={() => setStep(1)}
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      );
    } else if (step === 1) {
      if (testType === "Full Syllabus") {
        return (
          <Form {...fullSyllabusForm}>
            <form onSubmit={fullSyllabusForm.handleSubmit(generateTest)} className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                Full Syllabus Test
              </h2>
              
              <FormField
                control={fullSyllabusForm.control}
                name="numQuestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions</FormLabel>
                    <FormControl>
                      {/* Input expects string values */}
                      <Input {...field} type="number" min="1" max="100" />
                    </FormControl>
                    <FormDescription>
                      Recommended: 65 questions for full syllabus test
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={fullSyllabusForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      {/* Input expects string values */}
                      <Input {...field} type="number" min="1" max="600" />
                    </FormControl>
                    <FormDescription>
                      Recommended: 3 minutes per question (180 minutes total)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating
                    </>
                  ) : (
                    <>Generate Test</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        );
      } else if (testType === "Subject Wise") {
        return (
          <Form {...subjectWiseForm}>
            <form onSubmit={subjectWiseForm.handleSubmit(generateTest)} className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                Subject Wise Test
              </h2>
              
              <FormField
                control={subjectWiseForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjectList.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={subjectWiseForm.control}
                name="numQuestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions</FormLabel>
                    <FormControl>
                      {/* Input expects string values */}
                      <Input {...field} type="number" min="1" max="50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={subjectWiseForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      {/* Input expects string values */}
                      <Input {...field} type="number" min="1" max="120" />
                    </FormControl>
                    <FormDescription>
                      Recommended: 3 minutes per question
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating
                    </>
                  ) : (
                    <>Generate Test</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        );
      } else if (testType === "Multi-Subject Test") {
        return (
          <Form {...multiSubjectForm}>
            <form onSubmit={multiSubjectForm.handleSubmit(generateTest)} className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                Multi-Subject Test
              </h2>
              
              <FormField
                control={multiSubjectForm.control}
                name="numSubjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Subjects</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setNumSubjects(Number(value)); // Convert string to number when updating state
                      }} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of subjects" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 Subject</SelectItem>
                        <SelectItem value="2">2 Subjects</SelectItem>
                        <SelectItem value="3">3 Subjects</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {Array.from({ length: numSubjects }).map((_, index) => (
                <FormField
                  key={index}
                  control={multiSubjectForm.control}
                  name={`subjects.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject {index + 1}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select subject ${index + 1}`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjectList.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              
              <FormField
                control={multiSubjectForm.control}
                name="numQuestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions</FormLabel>
                    <FormControl>
                      {/* Input expects string values */}
                      <Input {...field} type="number" min="1" max="100" />
                    </FormControl>
                    <FormDescription>
                      Questions will be distributed evenly among subjects
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={multiSubjectForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      {/* Input expects string values */}
                      <Input {...field} type="number" min="1" max="300" />
                    </FormControl>
                    <FormDescription>
                      Recommended: 3 minutes per question
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating
                    </>
                  ) : (
                    <>Generate Test</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
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

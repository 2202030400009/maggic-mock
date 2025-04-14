
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { usePaper } from "@/context/PaperContext";
import { QuestionType } from "@/lib/types";
import { gateCSSubjects, gateDASubjects } from "@/constants/subjects";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Eye, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import PaperSwitcher from "@/components/PaperSwitcher";

function useQuery() {
  return new URLSearchParams(useLocation().search);
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
});

// Custom validation schema for required fields based on question type
const getValidationSchema = (questionType: QuestionType) => {
  const baseSchema = z.object({
    questionType: z.string(),
    questionText: z.string().min(1, "Question text is required"),
    imageUrl: z.string().optional(),
    marks: z.string(),
    subject: z.string(),
  });

  if (questionType === "MCQ") {
    return baseSchema.extend({
      options: z.array(z.string()).min(4, "All four options are required for MCQ").refine(
        (options) => options.every(opt => opt.trim().length > 0),
        "All four options must be filled"
      ),
      correctOption: z.string().min(1, "Please select a correct option"),
    });
  } else if (questionType === "MSQ") {
    return baseSchema.extend({
      options: z.array(z.string()).min(4, "All four options are required for MSQ").refine(
        (options) => options.every(opt => opt.trim().length > 0),
        "All four options must be filled"
      ),
      correctOptions: z.array(z.string()).min(1, "Please select at least one correct option"),
    });
  } else if (questionType === "NAT") {
    return baseSchema.extend({
      rangeStart: z.string().min(1, "Range start is required"),
      rangeEnd: z.string().min(1, "Range end is required"),
    });
  }

  return baseSchema;
};

const AddQuestion = () => {
  const { paperType } = usePaper();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryParams = useQuery();
  const isPYQ = queryParams.get('type') === 'pyq';
  const pyqYear = queryParams.get('year');
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  
  // Get subject list based on paper type
  const subjectList = paperType === "GATE CS" ? gateCSSubjects : gateDASubjects;
  
  // Get collection name
  const getCollectionName = () => {
    if (isPYQ && pyqYear && paperType) {
      return `pyqQuestions_${paperType.replace(" ", "_")}_${pyqYear}`;
    }
    return "questions";
  };
  
  // Count existing questions for PYQ
  useEffect(() => {
    const fetchQuestionCount = async () => {
      if (isPYQ && pyqYear && paperType) {
        try {
          const collectionName = getCollectionName();
          const q = query(collection(db, collectionName));
          const snapshot = await getDocs(q);
          setQuestionCount(snapshot.size);
        } catch (error) {
          console.error("Error counting questions:", error);
        }
      }
    };
    
    fetchQuestionCount();
  }, [isPYQ, pyqYear, paperType]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      questionType: "MCQ",
      questionText: "",
      imageUrl: "",
      options: ["", "", "", ""],
      correctOption: "",
      correctOptions: [],
      rangeStart: "",
      rangeEnd: "",
      marks: "1",
      subject: subjectList[0],
    },
  });

  const questionType = form.watch("questionType") as QuestionType;
  const marks = form.watch("marks");
  const imageUrl = form.watch("imageUrl");

  // Calculate negative marks based on question type and marks
  const calculateNegativeMarks = () => {
    if (questionType === "MCQ") {
      return marks === "1" ? -0.33 : -0.66;
    } else {
      return 0;
    }
  };

  const handlePreviewClick = () => {
    // Validate based on question type before opening the preview
    const schema = getValidationSchema(questionType);
    
    try {
      schema.parse(form.getValues());
      setPreviewOpen(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const path = err.path.join(".");
          form.setError(path as any, { 
            type: "manual", 
            message: err.message 
          });
        });
        
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields correctly",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (isSubmitDisabled) return;
    
    try {
      setIsSubmitDisabled(true);
      
      // Check if we're adding a PYQ and have reached 65 questions
      if (isPYQ && questionCount >= 65) {
        toast({
          title: "Limit Reached",
          description: `This PYQ already has 65 questions, which is the maximum allowed.`,
          variant: "destructive",
        });
        setIsSubmitDisabled(false);
        return;
      }
      
      // Custom validation based on question type
      const schema = getValidationSchema(questionType);
      
      try {
        schema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            toast({
              title: "Validation Error",
              description: err.message,
              variant: "destructive",
            });
          });
        }
        setIsSubmitDisabled(false);
        return;
      }
      
      const negativeMark = calculateNegativeMarks();
      const collectionName = getCollectionName();
      
      const questionData = {
        text: data.questionText,
        type: data.questionType as QuestionType,
        imageUrl: data.imageUrl || null,
        marks: parseInt(data.marks),
        negativeMark,
        subject: data.subject,
        paperType,
        timestamp: serverTimestamp(),
      };

      // Add type-specific fields
      if (data.questionType === "MCQ") {
        Object.assign(questionData, {
          options: data.options?.map((text, index) => ({
            id: String.fromCharCode(97 + index), // a, b, c, d
            text,
          })),
          correctOption: data.correctOption,
        });
      } else if (data.questionType === "MSQ") {
        Object.assign(questionData, {
          options: data.options?.map((text, index) => ({
            id: String.fromCharCode(97 + index), // a, b, c, d
            text,
          })),
          correctOptions: data.correctOptions,
        });
      } else if (data.questionType === "NAT") {
        Object.assign(questionData, {
          rangeStart: parseFloat(data.rangeStart || "0"),
          rangeEnd: parseFloat(data.rangeEnd || "0"),
        });
      }

      // Save to Firestore
      await addDoc(collection(db, collectionName), questionData);
      
      // Update question count for PYQ
      if (isPYQ) {
        setQuestionCount(prev => prev + 1);
      }

      toast({
        title: "Success!",
        description: "Question added successfully",
      });

      // Reset the form
      form.reset({
        questionType: "MCQ",
        questionText: "",
        imageUrl: "",
        options: ["", "", "", ""],
        correctOption: "",
        correctOptions: [],
        rangeStart: "",
        rangeEnd: "",
        marks: "1",
        subject: data.subject,
      });
      
      setPreviewOpen(false);
    } catch (error) {
      console.error("Error adding question:", error);
      toast({
        title: "Error",
        description: "Failed to add question. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Re-enable submit button after a short delay
      setTimeout(() => {
        setIsSubmitDisabled(false);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Add Question</h1>
            {isPYQ && pyqYear && (
              <Badge variant="outline" className="text-lg">
                {paperType} PYQ {pyqYear}
              </Badge>
            )}
            {isPYQ && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {questionCount}/65 questions
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <PaperSwitcher />
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Admin Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePreviewClick)} className="space-y-6">
              {/* Question Type */}
              <FormField
                control={form.control}
                name="questionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset specific fields based on the new question type
                        if (value === "MCQ") {
                          form.setValue("correctOptions", []);
                          form.setValue("rangeStart", "");
                          form.setValue("rangeEnd", "");
                        } else if (value === "MSQ") {
                          form.setValue("correctOption", "");
                          form.setValue("rangeStart", "");
                          form.setValue("rangeEnd", "");
                        } else if (value === "NAT") {
                          form.setValue("options", []);
                          form.setValue("correctOption", "");
                          form.setValue("correctOptions", []);
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MCQ">MCQ (Single Correct)</SelectItem>
                        <SelectItem value="MSQ">MSQ (Multiple Correct)</SelectItem>
                        <SelectItem value="NAT">NAT (Numerical Answer)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of question you want to add
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Subject */}
              <FormField
                control={form.control}
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
                          <SelectValue placeholder="Select subject" />
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

              {/* Question Text */}
              <FormField
                control={form.control}
                name="questionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the question text here" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image URL */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter image URL" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      If the question has an image, paste its URL here
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Preview */}
              {imageUrl && (
                <Card className="overflow-hidden">
                  <CardContent className="p-2">
                    <div className="text-sm text-gray-500 mb-2">Image Preview:</div>
                    <img 
                      src={imageUrl} 
                      alt="Question" 
                      className="max-h-[200px] object-contain mx-auto"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/400x200/f5f5f5/cccccc?text=Invalid+Image+URL";
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* MCQ Options */}
              {questionType === "MCQ" && (
                <>
                  <div className="space-y-4">
                    <div className="font-medium">Options *</div>
                    <p className="text-sm text-gray-500">All four options are required for MCQ questions</p>
                    {[0, 1, 2, 3].map((index) => (
                      <FormField
                        key={index}
                        control={form.control}
                        name={`options.${index}`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-medium">
                                {String.fromCharCode(97 + index).toUpperCase()}
                              </div>
                              <FormControl>
                                <Input 
                                  placeholder={`Option ${String.fromCharCode(65 + index)}*`} 
                                  {...field} 
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  {/* Correct Option */}
                  <FormField
                    control={form.control}
                    name="correctOption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correct Option *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select correct option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="a">Option A</SelectItem>
                            <SelectItem value="b">Option B</SelectItem>
                            <SelectItem value="c">Option C</SelectItem>
                            <SelectItem value="d">Option D</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* MSQ Options */}
              {questionType === "MSQ" && (
                <>
                  <div className="space-y-4">
                    <div className="font-medium">Options *</div>
                    <p className="text-sm text-gray-500">All four options are required for MSQ questions</p>
                    {[0, 1, 2, 3].map((index) => (
                      <FormField
                        key={index}
                        control={form.control}
                        name={`options.${index}`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-medium">
                                {String.fromCharCode(97 + index).toUpperCase()}
                              </div>
                              <FormControl>
                                <Input 
                                  placeholder={`Option ${String.fromCharCode(65 + index)}*`} 
                                  {...field} 
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  {/* Correct Options */}
                  <div>
                    <FormLabel className="block mb-2">Correct Options *</FormLabel>
                    <p className="text-sm text-gray-500 mb-2">Select at least one correct option</p>
                    <div className="space-y-2">
                      {["a", "b", "c", "d"].map((option, index) => (
                        <FormField
                          key={option}
                          control={form.control}
                          name="correctOptions"
                          render={({ field }) => {
                            return (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(option)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value || [], option])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== option
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Option {String.fromCharCode(65 + index)}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </div>
                </>
              )}

              {/* NAT Range */}
              {questionType === "NAT" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rangeStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Range Start *</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormDescription>
                          Minimum acceptable value
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rangeEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Range End *</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximum acceptable value
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Marks */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="marks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marks</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select marks" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 Mark</SelectItem>
                          <SelectItem value="2">2 Marks</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel>Negative Marking</FormLabel>
                  <Input 
                    value={calculateNegativeMarks()} 
                    disabled 
                    className="bg-gray-100"
                  />
                  <FormDescription>
                    Auto-calculated based on question type and marks
                  </FormDescription>
                </FormItem>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={isSubmitDisabled}
                >
                  <Eye className="mr-1 h-4 w-4" /> Preview Question
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Question Preview</DialogTitle>
            <DialogDescription>
              Review the question before adding it to the system
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            {/* Question Text */}
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Question:</div>
              <p className="text-lg">{form.getValues("questionText")}</p>
            </div>

            {/* Image */}
            {imageUrl && (
              <div>
                <div className="text-sm text-gray-500 mb-2">Image:</div>
                <img 
                  src={imageUrl} 
                  alt="Question" 
                  className="max-h-[200px] object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/400x200/f5f5f5/cccccc?text=Invalid+Image+URL";
                  }}
                />
              </div>
            )}

            {/* Options for MCQ and MSQ */}
            {(questionType === "MCQ" || questionType === "MSQ") && (
              <div className="space-y-3">
                <div className="text-sm text-gray-500">Options:</div>
                {form.getValues("options")?.map((option, index) => (
                  <div 
                    key={index} 
                    className={`p-3 border rounded-md ${
                      questionType === "MCQ"
                        ? form.getValues("correctOption") === String.fromCharCode(97 + index)
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200"
                        : form.getValues("correctOptions")?.includes(String.fromCharCode(97 + index))
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-medium mr-3">
                        {String.fromCharCode(97 + index).toUpperCase()}
                      </div>
                      <span>{option}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* NAT Range */}
            {questionType === "NAT" && (
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Answer Range:</div>
                <p>
                  {form.getValues("rangeStart")} to {form.getValues("rangeEnd")}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <div className="text-sm text-gray-500">Subject:</div>
                <p>{form.getValues("subject")}</p>
              </div>
              <div>
                <div className="text-sm text-gray-500">Marks:</div>
                <p>{form.getValues("marks")} ({calculateNegativeMarks()} negative marks)</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPreviewOpen(false)}
              disabled={isSubmitDisabled}
            >
              Edit
            </Button>
            <Button 
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isSubmitDisabled}
            >
              <Save className="mr-1 h-4 w-4" /> Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddQuestion;

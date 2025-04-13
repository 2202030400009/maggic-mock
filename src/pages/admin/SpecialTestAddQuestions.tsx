
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePaper } from "@/context/PaperContext";
import { QuestionType } from "@/lib/types";
import { gateCSSubjects, gateDASubjects } from "@/constants/subjects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Question } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PaperSwitcher from "@/components/PaperSwitcher";

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
});

const SpecialTestAddQuestions = () => {
  const { testId } = useParams();
  const { paperType } = usePaper();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Get subject list based on paper type
  const subjectList = paperType === "GATE CS" ? gateCSSubjects : gateDASubjects;
  
  // Load test data
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        if (!testId) return;
        
        const testDocRef = doc(db, "specialTests", testId);
        const testSnapshot = await getDoc(testDocRef);
        
        if (testSnapshot.exists()) {
          setTestData({ id: testSnapshot.id, ...testSnapshot.data() });
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
      negativeMark: -0.33,
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

  const handleOptionChange = (index: number, value: string) => {
    const options = form.getValues("options") || ["", "", "", ""];
    options[index] = value;
    form.setValue("options", options);
  };

  const toggleCorrectOption = (optionId: string) => {
    const correctOptions = form.getValues("correctOptions") || [];
    if (correctOptions.includes(optionId)) {
      form.setValue("correctOptions", correctOptions.filter(id => id !== optionId));
    } else {
      form.setValue("correctOptions", [...correctOptions, optionId]);
    }
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!testId) return;
    
    try {
      setIsSubmitting(true);
      
      // Validate form based on question type
      if (questionType === "MCQ" || questionType === "MSQ") {
        const filledOptions = (data.options || []).filter(opt => opt.trim() !== "");
        if (filledOptions.length < 2) {
          toast({
            title: "Error",
            description: "At least two options are required",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        if (questionType === "MCQ" && !data.correctOption) {
          toast({
            title: "Error",
            description: "Please select a correct option",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        if (questionType === "MSQ" && (!data.correctOptions || data.correctOptions.length === 0)) {
          toast({
            title: "Error",
            description: "Please select at least one correct option",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      if (questionType === "NAT" && (!data.rangeStart || !data.rangeEnd)) {
        toast({
          title: "Error",
          description: "Please provide both range values for NAT question",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      const negativeMark = calculateNegativeMarks();
      
      // Create question object
      const questionObj: any = {
        text: data.questionText,
        type: questionType,
        marks: parseInt(data.marks),
        negativeMark,
        subject: data.subject,
        paperType,
      };
      
      if (data.imageUrl) {
        questionObj.imageUrl = data.imageUrl;
      }
      
      // Add type-specific fields
      if (questionType === "MCQ" || questionType === "MSQ") {
        const validOptions = (data.options || [])
          .filter(opt => opt.trim() !== "")
          .map((text, i) => ({ id: String.fromCharCode(97 + i), text })); // a, b, c, d
          
        questionObj.options = validOptions;
        
        if (questionType === "MCQ") {
          questionObj.correctOption = data.correctOption;
        } else {
          questionObj.correctOptions = data.correctOptions;
        }
      } else if (questionType === "NAT") {
        questionObj.rangeStart = parseFloat(data.rangeStart || "0");
        questionObj.rangeEnd = parseFloat(data.rangeEnd || "0");
      }
      
      // Step 1: Add question to the general questions collection
      const generalQuestionRef = await addDoc(collection(db, "questions"), questionObj);
      
      // Step 2: Add question reference to the special test
      const testDocRef = doc(db, "specialTests", testId);
      await updateDoc(testDocRef, {
        questions: arrayUnion({
          id: generalQuestionRef.id,
          ...questionObj
        })
      });
      
      // Reset form
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
      
      toast({
        title: "Success",
        description: "Question added successfully",
      });
      
      // Update local test data
      setTestData({
        ...testData,
        questions: [
          ...(testData.questions || []),
          { id: generalQuestionRef.id, ...questionObj }
        ]
      });
      
    } catch (error) {
      console.error("Error adding question:", error);
      toast({
        title: "Error",
        description: "Failed to add question",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
          <Card>
            <CardHeader>
              <CardTitle>Add New Question</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(() => setPreviewOpen(true))} className="space-y-6">
                  {/* Question Type */}
                  <FormField
                    control={form.control}
                    name="questionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
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
                        <FormLabel>Question Text</FormLabel>
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
                            (e.target as HTMLImageElement).src = "https://placehold.co/400x200/f5f5f5/cccccc?text=Invalid+Image+URL";
                          }}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* MCQ Options */}
                  {questionType === "MCQ" && (
                    <>
                      <div className="space-y-4">
                        <div className="font-medium">Options</div>
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
                                      placeholder={`Option ${String.fromCharCode(65 + index)}`} 
                                      value={field.value}
                                      onChange={(e) => handleOptionChange(index, e.target.value)}
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>

                      {/* Correct Option for MCQ */}
                      <FormField
                        control={form.control}
                        name="correctOption"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correct Option</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
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
                        <div className="font-medium">Options</div>
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
                                      placeholder={`Option ${String.fromCharCode(65 + index)}`} 
                                      value={field.value}
                                      onChange={(e) => handleOptionChange(index, e.target.value)}
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>

                      {/* Correct Options for MSQ */}
                      <div>
                        <FormLabel className="block mb-2">Correct Options</FormLabel>
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
                                        onCheckedChange={() => toggleCorrectOption(option)}
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
                            <FormLabel>Range Start</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any" 
                                placeholder="Min acceptable value"
                                {...field} 
                              />
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
                            <FormLabel>Range End</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="any"
                                placeholder="Max acceptable value"
                                {...field} 
                              />
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
                    <Button type="button" variant="outline" onClick={() => navigate("/admin/special-tests")}>
                      Done
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                      <Eye className="mr-1 h-4 w-4" /> Preview Question
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Test Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Test Name</dt>
                  <dd className="text-lg">{testData?.name}</dd>
                </div>
                {testData?.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd>{testData?.description}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Questions</dt>
                  <dd>
                    <span className="text-lg">{testData?.questions?.length || 0}</span>
                    <span className="text-sm text-gray-500"> / {testData?.numQuestions}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd>{testData?.duration} minutes</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Question Preview</DialogTitle>
            <DialogDescription>
              Review the question before adding it to the test
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
                    (e.target as HTMLImageElement).src = "https://placehold.co/400x200/f5f5f5/cccccc?text=Invalid+Image+URL";
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
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Edit
            </Button>
            <Button 
              type="button"
              onClick={form.handleSubmit(handleSubmit)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="mr-1 h-4 w-4" /> Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpecialTestAddQuestions;

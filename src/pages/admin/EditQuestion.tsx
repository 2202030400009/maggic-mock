
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Question, QuestionType } from "@/lib/types";
import { gateCSSubjects, gateDASubjects } from "@/constants/subjects";
import { usePaper } from "@/context/PaperContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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

const EditQuestion = () => {
  const navigate = useNavigate();
  const { paperType } = usePaper();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get subject list based on paper type
  const subjectList = paperType === "GATE CS" ? gateCSSubjects : gateDASubjects;

  // Load the question to edit from session storage
  useEffect(() => {
    const storedQuestion = sessionStorage.getItem('questionToEdit');
    if (storedQuestion) {
      const parsedQuestion = JSON.parse(storedQuestion);
      setQuestion(parsedQuestion);
      setLoading(false);
    } else {
      toast({
        title: "Error",
        description: "No question to edit found",
        variant: "destructive",
      });
      navigate("/admin/questions");
    }
  }, [navigate]);

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

  // Initialize form values when question data is loaded
  useEffect(() => {
    if (question && !loading) {
      const questionType = question.type;
      form.reset({
        questionType: questionType,
        questionText: question.text || "",
        imageUrl: question.imageUrl || "",
        options: question.options?.map(opt => opt.text) || ["", "", "", ""],
        correctOption: questionType === "MCQ" ? question.correctOption || "" : "",
        correctOptions: questionType === "MSQ" ? question.correctOptions || [] : [],
        rangeStart: questionType === "NAT" ? String(question.rangeStart || "") : "",
        rangeEnd: questionType === "NAT" ? String(question.rangeEnd || "") : "",
        marks: String(question.marks || 1),
        subject: question.subject || subjectList[0],
        negativeMark: question.negativeMark || -0.33,
      });
    }
  }, [question, loading, form, subjectList]);

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
    if (!question || !question.id) return;
    
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
      
      // Create updated question object
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
      
      // Update the question in Firestore
      const questionRef = doc(db, "questions", question.id);
      await updateDoc(questionRef, questionObj);
      
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
      
      // Clear the session storage
      sessionStorage.removeItem('questionToEdit');
      
      // Navigate back to the question list
      navigate("/admin/questions");
      
    } catch (error) {
      console.error("Error updating question:", error);
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-10 text-center">Loading question data...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Edit Question</h1>
        <Button onClick={() => navigate("/admin/questions")}>Back to Questions</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Edit Question Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Question Type */}
              <FormField
                control={form.control}
                name="questionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
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
                      Select the type of question
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
                      value={field.value}
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
                                  value={field.value || ''}
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
                          value={field.value || ''}
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
                                  value={field.value || ''}
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
                        value={field.value}
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

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/admin/questions")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditQuestion;

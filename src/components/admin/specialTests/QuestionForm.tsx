
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gateCSSubjects, gateDASubjects } from "@/constants/subjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye } from "lucide-react";
import { QuestionType } from "@/lib/types";

const formSchema = z.object({
  questionType: z.string(),
  questionText: z.string().min(1, "Question text is required"),
  imageUrl: z.string().optional(),
  options: z.array(z.string()).min(4, "You must provide exactly 4 options for MCQ/MSQ"),
  correctOption: z.string().optional(),
  correctOptions: z.array(z.string()).optional(),
  rangeStart: z.string().optional(),
  rangeEnd: z.string().optional(),
  marks: z.string(),
  subject: z.string(),
  negativeMark: z.number().optional(),
});

interface QuestionFormProps {
  paperType: string;
  onPreview: (data: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ paperType, onPreview, onCancel }) => {
  const subjectList = paperType === "GATE CS" ? gateCSSubjects : gateDASubjects;
  
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onPreview)} className="space-y-6">
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

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Done
          </Button>
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
            <Eye className="mr-1 h-4 w-4" /> Preview Question
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default QuestionForm;

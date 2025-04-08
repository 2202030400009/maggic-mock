
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";

// Schema for Subject Wise form with proper transformations
const SubjectWiseSchema = z.object({
  subject: z.string().min(1, "Required"),
  numQuestions: z
    .string()
    .min(1, "Must have at least 1 question")
    .transform(val => parseInt(val, 10)),
  duration: z
    .string()
    .min(1, "Duration must be at least 1 minute")
    .transform(val => parseInt(val, 10)),
});

// Properly typed form values derived from schema
export type SubjectWiseFormValues = z.infer<typeof SubjectWiseSchema>;

interface SubjectWiseFormProps {
  onSubmit: (values: SubjectWiseFormValues) => void;
  onBack: () => void;
  loading: boolean;
  subjectList: string[];
}

const SubjectWiseForm = ({ onSubmit, onBack, loading, subjectList }: SubjectWiseFormProps) => {
  const form = useForm<z.infer<typeof SubjectWiseSchema>>({
    resolver: zodResolver(SubjectWiseSchema),
    defaultValues: {
      subject: subjectList[0] || "",
      numQuestions: "20",
      duration: "60",
    },
  });

  // Update duration based on question count
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "numQuestions" && value.numQuestions) {
        const numQuestions = parseInt(value.numQuestions, 10);
        if (!isNaN(numQuestions)) {
          form.setValue("duration", String(numQuestions * 3));
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Subject Wise Test
        </h2>
        
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
          control={form.control}
          name="numQuestions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Questions</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  max="50" 
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  max={String(parseInt(form.getValues("numQuestions") || "20", 10) * 10)}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Recommended: 3 minutes per question (auto-calculated)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
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
};

export default SubjectWiseForm;

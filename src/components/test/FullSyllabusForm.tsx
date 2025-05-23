
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Define form schema with string inputs
const FullSyllabusSchema = z.object({
  numQuestions: z.string()
    .min(1, "Must have at least 1 question"),
  duration: z.string()
    .min(1, "Duration must be at least 1 minute"),
});

// Raw form values before transformation
type FullSyllabusFormRawValues = z.infer<typeof FullSyllabusSchema>;

// Properly typed form values after transformation
export type FullSyllabusFormValues = {
  numQuestions: number;
  duration: number;
};

// Helper to transform form values after validation
const transformFormValues = (values: FullSyllabusFormRawValues): FullSyllabusFormValues => {
  return {
    numQuestions: parseInt(values.numQuestions, 10),
    duration: parseInt(values.duration, 10),
  };
};

interface FullSyllabusFormProps {
  onSubmit: (values: FullSyllabusFormValues) => void;
  onBack: () => void;
  loading: boolean;
}

const FullSyllabusForm = ({ onSubmit, onBack, loading }: FullSyllabusFormProps) => {
  const form = useForm<FullSyllabusFormRawValues>({
    resolver: zodResolver(FullSyllabusSchema),
    defaultValues: {
      numQuestions: "65",
      duration: "180",
    },
  });

  const handleFormSubmit = (values: FullSyllabusFormRawValues) => {
    const transformedValues = transformFormValues(values);
    onSubmit(transformedValues);
  };

  // Update duration based on question count
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "numQuestions" && value.numQuestions) {
        const numQuestions = parseInt(value.numQuestions, 10);
        if (!isNaN(numQuestions)) {
          // Update duration to 3 minutes per question as string
          form.setValue("duration", String(numQuestions * 3));
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Full Syllabus Test
        </h2>
        
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
                  max="100"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Recommended: 65 questions for full syllabus test
              </FormDescription>
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
                  max={String(parseInt(form.getValues("numQuestions") || "65", 10) * 10)}
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

export default FullSyllabusForm;

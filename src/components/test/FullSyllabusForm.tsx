
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

// Define form schema with proper transformations
const FullSyllabusSchema = z.object({
  numQuestions: z
    .string()
    .min(1, "Required")
    .transform((val) => Number(val)),
  duration: z
    .string()
    .min(1, "Required")
    .transform((val) => Number(val)),
});

// Properly typed form values derived from schema
export type FullSyllabusFormValues = z.infer<typeof FullSyllabusSchema>;

interface FullSyllabusFormProps {
  onSubmit: (values: FullSyllabusFormValues) => void;
  onBack: () => void;
  loading: boolean;
}

const FullSyllabusForm = ({ onSubmit, onBack, loading }: FullSyllabusFormProps) => {
  const form = useForm<FullSyllabusFormValues>({
    resolver: zodResolver(FullSyllabusSchema),
    defaultValues: {
      numQuestions: "65",
      duration: "180",
    },
  });

  // Update duration based on question count
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "numQuestions") {
        const numQuestions = Number(value.numQuestions || 65);
        form.setValue("duration", String(numQuestions * 3));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="1" max={Number(form.getValues("numQuestions") || 65) * 10} />
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

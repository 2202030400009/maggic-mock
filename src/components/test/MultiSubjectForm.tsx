
import React, { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema for Multi-Subject form with proper transformations
const MultiSubjectSchema = z.object({
  numSubjects: z
    .string()
    .min(1, "Required")
    .transform((val) => Number(val)),
  subjects: z.array(z.string()).optional(),
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
export type MultiSubjectFormValues = z.infer<typeof MultiSubjectSchema>;

interface MultiSubjectFormProps {
  onSubmit: (values: MultiSubjectFormValues) => void;
  onBack: () => void;
  loading: boolean;
  subjectList: string[];
}

const MultiSubjectForm = ({ onSubmit, onBack, loading, subjectList }: MultiSubjectFormProps) => {
  const [numSubjects, setNumSubjects] = useState<number>(2);
  
  const form = useForm<MultiSubjectFormValues>({
    resolver: zodResolver(MultiSubjectSchema),
    defaultValues: {
      numSubjects: "2",
      subjects: [subjectList[0] || "", subjectList[1] || ""],
      numQuestions: "30",
      duration: "90",
    },
  });

  // Update form based on number of subjects
  useEffect(() => {
    const subjects = form.getValues("subjects") || [];
    const numSubjectsValue = Number(form.getValues("numSubjects"));
    
    if (numSubjectsValue !== numSubjects) {
      setNumSubjects(numSubjectsValue);
    }
    
    if (subjects.length !== numSubjects) {
      const newSubjects = [...subjects];
      if (newSubjects.length < numSubjects) {
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
        newSubjects.splice(numSubjects);
      }
      form.setValue("subjects", newSubjects);
    }
  }, [numSubjects, form, subjectList]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Multi-Subject Test
        </h2>
        
        <FormField
          control={form.control}
          name="numSubjects"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Subjects</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setNumSubjects(Number(value));
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
            control={form.control}
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
          control={form.control}
          name="numQuestions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Questions</FormLabel>
              <FormControl>
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
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
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

export default MultiSubjectForm;

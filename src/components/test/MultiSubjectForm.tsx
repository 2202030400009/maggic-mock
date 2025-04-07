
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
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
import SubjectSelector from "./SubjectSelector";
import TestFormField from "./TestFormField";
import { 
  MultiSubjectSchema, 
  MultiSubjectFormValues,
  calculateTestDuration
} from "./schemas/multiSubjectSchema";

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
      numSubjects: 2,
      subjects: [subjectList[0] || "", subjectList[1] || ""],
      numQuestions: 30,
      duration: 90,
    },
  });

  // Update duration based on question count
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "numQuestions") {
        const numQuestions = Number(value.numQuestions);
        if (!isNaN(numQuestions)) {
          form.setValue("duration", calculateTestDuration(numQuestions));
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Update form based on number of subjects
  useEffect(() => {
    const subjects = form.getValues("subjects") || [];
    const numSubjectsValue = form.getValues("numSubjects");
    
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
                  const numValue = parseInt(value, 10);
                  field.onChange(numValue);
                  setNumSubjects(numValue);
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
          <SubjectSelector 
            key={index} 
            control={form.control} 
            subjectList={subjectList} 
            index={index} 
          />
        ))}
        
        <TestFormField
          control={form.control}
          name="numQuestions"
          label="Number of Questions"
          description="Questions will be distributed evenly among subjects"
          type="number"
          min="1"
          max="100"
        />
        
        <TestFormField
          control={form.control}
          name="duration"
          label="Duration (minutes)"
          description="Recommended: 3 minutes per question (auto-calculated)"
          type="number"
          min="1"
          max={Number(form.getValues("numQuestions") || 30) * 10}
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
export type { MultiSubjectFormValues };

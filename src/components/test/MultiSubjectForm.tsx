
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
  MultiSubjectFormRawValues, 
  calculateTestDuration,
  transformFormValues
} from "./schemas/multiSubjectSchema";

interface MultiSubjectFormProps {
  onSubmit: (values: MultiSubjectFormValues) => void;
  onBack: () => void;
  loading: boolean;
  subjectList: string[];
}

const MultiSubjectForm = ({ onSubmit, onBack, loading, subjectList }: MultiSubjectFormProps) => {
  const [numSubjects, setNumSubjects] = useState<number>(2);
  
  const form = useForm<MultiSubjectFormRawValues>({
    resolver: zodResolver(MultiSubjectSchema),
    defaultValues: {
      numSubjects: "2", // String for select compatibility
      subjects: [subjectList[0] || "", subjectList[1] || ""],
      numQuestions: "30", // String for input compatibility
      duration: "90", // String for input compatibility
    },
  });

  const handleFormSubmit = (values: MultiSubjectFormRawValues) => {
    const transformedValues = transformFormValues(values);
    onSubmit(transformedValues);
  };

  // Update duration based on question count
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "numQuestions" && value.numQuestions) {
        const numQuestions = parseInt(value.numQuestions, 10);
        if (!isNaN(numQuestions)) {
          form.setValue("duration", String(calculateTestDuration(numQuestions)));
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Update form based on number of subjects
  useEffect(() => {
    const subjects = form.getValues("subjects") || [];
    const numSubjectsValue = parseInt(form.getValues("numSubjects") || "2", 10);
    
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
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
                  setNumSubjects(parseInt(value, 10));
                }} 
                defaultValue={field.value}
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
          max={String(parseInt(form.getValues("numQuestions") || "30", 10) * 10)}
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

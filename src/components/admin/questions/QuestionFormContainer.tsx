
import React from "react";
import { z } from "zod";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import QuestionForm from "@/components/admin/specialTests/QuestionForm";

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

type FormData = z.infer<typeof formSchema>;

interface QuestionFormContainerProps {
  paperType: string;
  onPreview: (data: FormData) => void;
  onCancel: () => void;
}

const QuestionFormContainer: React.FC<QuestionFormContainerProps> = ({
  paperType,
  onPreview,
  onCancel
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Question</CardTitle>
      </CardHeader>
      <CardContent>
        <QuestionForm 
          paperType={paperType}
          onPreview={onPreview}
          onCancel={onCancel}
        />
      </CardContent>
    </Card>
  );
};

export default QuestionFormContainer;

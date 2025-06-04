
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Star } from "lucide-react";
import { isValidImageUrl } from "@/utils/imageUtils";

interface QuestionFormProps {
  paperType: string;
  onPreview: (data: any) => void;
  onCancel: () => void;
}

const QuestionForm = ({ paperType, onPreview, onCancel }: QuestionFormProps) => {
  const [questionType, setQuestionType] = useState("MCQ");
  const [questionText, setQuestionText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState("");
  const [correctOptions, setCorrectOptions] = useState<string[]>([]);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [subject, setSubject] = useState("");
  const [marks, setMarks] = useState("1");
  const [difficultyLevel, setDifficultyLevel] = useState(3);

  const subjects = paperType === "GATE CS" 
    ? ["Programming", "Data Structures", "Algorithms", "Computer Networks", "Operating Systems", "Database Management", "Computer Organization", "Theory of Computation", "Compiler Design", "Software Engineering", "Digital Logic", "Discrete Mathematics", "Engineering Mathematics", "General Aptitude"]
    : ["Quantitative Aptitude", "Verbal Ability", "Data Interpretation", "Logical Reasoning", "General Knowledge"];

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCorrectOptionToggle = (optionIndex: string) => {
    if (correctOptions.includes(optionIndex)) {
      setCorrectOptions(correctOptions.filter(opt => opt !== optionIndex));
    } else {
      setCorrectOptions([...correctOptions, optionIndex]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = {
      questionType,
      questionText,
      imageUrl,
      options,
      correctOption,
      correctOptions,
      rangeStart,
      rangeEnd,
      subject,
      marks,
      difficultyLevel
    };
    
    onPreview(formData);
  };

  const renderStarRating = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 cursor-pointer transition-colors ${
              star <= difficultyLevel
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            }`}
            onClick={() => setDifficultyLevel(star)}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">
          Difficulty: {difficultyLevel}/5
        </span>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="questionType">Question Type</Label>
          <Select value={questionType} onValueChange={setQuestionType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MCQ">Multiple Choice (MCQ)</SelectItem>
              <SelectItem value="MSQ">Multiple Select (MSQ)</SelectItem>
              <SelectItem value="NAT">Numerical Answer (NAT)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="questionText">Question Text</Label>
        <Textarea
          id="questionText"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter the question text..."
          className="min-h-[100px]"
          required
        />
      </div>

      <div>
        <Label htmlFor="imageUrl">Question Image URL (Optional)</Label>
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
        {imageUrl && isValidImageUrl(imageUrl) && (
          <div className="mt-2">
            <img 
              src={imageUrl} 
              alt="Question preview" 
              className="max-w-xs max-h-48 object-contain rounded border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {(questionType === "MCQ" || questionType === "MSQ") && (
        <div>
          <Label>Options</Label>
          {options.map((option, index) => (
            <div key={index} className="mt-2">
              <div className="flex items-center space-x-2">
                {questionType === "MCQ" ? (
                  <input
                    type="radio"
                    name="correctOption"
                    checked={correctOption === String.fromCharCode(97 + index)}
                    onChange={() => setCorrectOption(String.fromCharCode(97 + index))}
                    className="shrink-0"
                  />
                ) : (
                  <Checkbox
                    checked={correctOptions.includes(String.fromCharCode(97 + index))}
                    onCheckedChange={() => handleCorrectOptionToggle(String.fromCharCode(97 + index))}
                  />
                )}
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + index)} (text or image URL)`}
                  className="flex-1"
                />
              </div>
              {option && isValidImageUrl(option) && (
                <div className="mt-2 ml-6">
                  <img 
                    src={option} 
                    alt={`Option ${String.fromCharCode(65 + index)} preview`} 
                    className="max-w-32 max-h-24 object-contain rounded border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {questionType === "NAT" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rangeStart">Range Start</Label>
            <Input
              id="rangeStart"
              type="number"
              step="0.01"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              placeholder="e.g., 5.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="rangeEnd">Range End</Label>
            <Input
              id="rangeEnd"
              type="number"
              step="0.01"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              placeholder="e.g., 6.5"
              required
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="marks">Marks</Label>
          <Select value={marks} onValueChange={setMarks}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Mark</SelectItem>
              <SelectItem value="2">2 Marks</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Difficulty Level</Label>
          <div className="mt-2">
            {renderStarRating()}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Preview Question
        </Button>
      </div>
    </form>
  );
};

export default QuestionForm;


import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Question } from "@/lib/types";

const SpecialTestAddQuestions = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Question form fields
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"MCQ" | "MSQ" | "NAT">("MCQ");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState("");
  const [correctOptions, setCorrectOptions] = useState<string[]>([]);
  const [natRangeStart, setNatRangeStart] = useState<number | undefined>(undefined);
  const [natRangeEnd, setNatRangeEnd] = useState<number | undefined>(undefined);
  const [marks, setMarks] = useState(1);
  const [negativeMark, setNegativeMark] = useState(0);
  const [subject, setSubject] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  // Load test data
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        if (!testId) return;
        
        const testDocRef = doc(db, "specialTests", testId);
        const testSnapshot = await getDoc(testDocRef);
        
        if (testSnapshot.exists()) {
          setTestData({ id: testSnapshot.id, ...testSnapshot.data() });
        } else {
          toast({
            title: "Error",
            description: "Special test not found",
            variant: "destructive",
          });
          navigate("/admin");
        }
      } catch (error) {
        console.error("Error fetching test data:", error);
        toast({
          title: "Error",
          description: "Failed to load test data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestData();
  }, [testId, navigate]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const toggleCorrectOption = (optionId: string) => {
    if (correctOptions.includes(optionId)) {
      setCorrectOptions(correctOptions.filter(id => id !== optionId));
    } else {
      setCorrectOptions([...correctOptions, optionId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testId) return;
    
    try {
      setIsSubmitting(true);
      
      // Validate form based on question type
      if (questionType === "MCQ" || questionType === "MSQ") {
        const filledOptions = options.filter(opt => opt.trim() !== "");
        if (filledOptions.length < 2) {
          toast({
            title: "Error",
            description: "At least two options are required",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        if (questionType === "MCQ" && !correctOption) {
          toast({
            title: "Error",
            description: "Please select a correct option",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        if (questionType === "MSQ" && correctOptions.length === 0) {
          toast({
            title: "Error",
            description: "Please select at least one correct option",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      if (questionType === "NAT" && (natRangeStart === undefined || natRangeEnd === undefined)) {
        toast({
          title: "Error",
          description: "Please provide both range values for NAT question",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Create question object
      const questionObj: any = {
        text: questionText,
        type: questionType,
        marks: marks,
        negativeMark: negativeMark,
        subject: subject,
        paperType: testData.paperType,
      };
      
      if (imageUrl) {
        questionObj.imageUrl = imageUrl;
      }
      
      // Add type-specific fields
      if (questionType === "MCQ" || questionType === "MSQ") {
        const validOptions = options
          .filter(opt => opt.trim() !== "")
          .map((text, i) => ({ id: `option${i + 1}`, text }));
          
        questionObj.options = validOptions;
        
        if (questionType === "MCQ") {
          questionObj.correctOption = correctOption;
        } else {
          questionObj.correctOptions = correctOptions;
        }
      } else if (questionType === "NAT") {
        questionObj.rangeStart = natRangeStart;
        questionObj.rangeEnd = natRangeEnd;
      }
      
      // Step 1: Add question to the general questions collection
      const generalQuestionRef = await addDoc(collection(db, "questions"), questionObj);
      
      // Step 2: Add question reference to the special test
      const testDocRef = doc(db, "specialTests", testId);
      await updateDoc(testDocRef, {
        questions: arrayUnion({
          id: generalQuestionRef.id,
          ...questionObj
        })
      });
      
      // Reset form
      setQuestionText("");
      setQuestionType("MCQ");
      setOptions(["", "", "", ""]);
      setCorrectOption("");
      setCorrectOptions([]);
      setNatRangeStart(undefined);
      setNatRangeEnd(undefined);
      setMarks(1);
      setNegativeMark(0);
      setImageUrl("");
      
      toast({
        title: "Success",
        description: "Question added successfully",
      });
      
      // Update local test data
      setTestData({
        ...testData,
        questions: [
          ...(testData.questions || []),
          { id: generalQuestionRef.id, ...questionObj }
        ]
      });
      
    } catch (error) {
      console.error("Error adding question:", error);
      toast({
        title: "Error",
        description: "Failed to add question",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-10 text-center">Loading test data...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Add Questions to {testData?.name}</h1>
        <Button onClick={() => navigate("/admin/special-tests")}>Back to Tests</Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Add New Question</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Question Text */}
                <div className="space-y-2">
                  <Label htmlFor="questionText">Question Text</Label>
                  <Textarea
                    id="questionText"
                    placeholder="Enter the question text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
                
                {/* Question Type */}
                <div className="space-y-2">
                  <Label htmlFor="questionType">Question Type</Label>
                  <Select 
                    value={questionType} 
                    onValueChange={(value: "MCQ" | "MSQ" | "NAT") => setQuestionType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCQ">Multiple Choice (Single Answer)</SelectItem>
                      <SelectItem value="MSQ">Multiple Choice (Multiple Answers)</SelectItem>
                      <SelectItem value="NAT">Numerical Answer Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Options for MCQ/MSQ */}
                {(questionType === "MCQ" || questionType === "MSQ") && (
                  <div className="space-y-4">
                    <Label>Options</Label>
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        
                        {questionType === "MCQ" ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={correctOption === `option${index + 1}`}
                              onChange={() => setCorrectOption(`option${index + 1}`)}
                              id={`correctOption${index}`}
                            />
                            <Label htmlFor={`correctOption${index}`}>Correct</Label>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={correctOptions.includes(`option${index + 1}`)}
                              onCheckedChange={() => toggleCorrectOption(`option${index + 1}`)}
                              id={`correctOption${index}`}
                            />
                            <Label htmlFor={`correctOption${index}`}>Correct</Label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Range for NAT */}
                {questionType === "NAT" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rangeStart">Range Start</Label>
                      <Input
                        id="rangeStart"
                        type="number"
                        step="0.01"
                        value={natRangeStart !== undefined ? natRangeStart : ""}
                        onChange={(e) => setNatRangeStart(e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="Minimum accepted value"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rangeEnd">Range End</Label>
                      <Input
                        id="rangeEnd"
                        type="number"
                        step="0.01"
                        value={natRangeEnd !== undefined ? natRangeEnd : ""}
                        onChange={(e) => setNatRangeEnd(e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="Maximum accepted value"
                      />
                    </div>
                  </div>
                )}
                
                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                
                {/* Marks and Negative Marking */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marks">Marks</Label>
                    <Input
                      id="marks"
                      type="number"
                      min="1"
                      value={marks}
                      onChange={(e) => setMarks(parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="negativeMark">Negative Marks</Label>
                    <Input
                      id="negativeMark"
                      type="number"
                      min="0"
                      step="0.25"
                      value={negativeMark}
                      onChange={(e) => setNegativeMark(parseFloat(e.target.value))}
                    />
                  </div>
                </div>
                
                {/* Image URL (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    placeholder="Enter image URL if applicable"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" type="button" onClick={() => navigate("/admin")}>
                    Done
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Question"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Test Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Test Name</dt>
                  <dd className="text-lg">{testData?.name}</dd>
                </div>
                {testData?.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd>{testData?.description}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Questions</dt>
                  <dd>
                    <span className="text-lg">{testData?.questions?.length || 0}</span>
                    <span className="text-sm text-gray-500"> / {testData?.numQuestions}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd>{testData?.duration} minutes</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SpecialTestAddQuestions;


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { usePaper } from "@/context/PaperContext";

const CreateTest = () => {
  const { paperType } = usePaper();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [testType, setTestType] = useState<string>("");
  const [numQuestions, setNumQuestions] = useState<number>(65);
  const [time, setTime] = useState<number>(180);
  const [subject, setSubject] = useState<string>("");
  const [numSubjects, setNumSubjects] = useState<number>(1);
  const [subjects, setSubjects] = useState<string[]>([]);

  const getCSSubjects = () => [
    "Aptitude", 
    "Engineering Maths", 
    "Discrete Maths", 
    "Digital Logic", 
    "Computer Organization and Architecture", 
    "Programming and Data Structures", 
    "Algorithms", 
    "Theory of Computation", 
    "Compiler Design", 
    "Operating System", 
    "Database", 
    "Computer Networking"
  ];

  const getDASubjects = () => [
    "Aptitude", 
    "Linear Algebra", 
    "Calculus", 
    "Probability & Statistics", 
    "Programming and Data Structures", 
    "Algorithms", 
    "Database & Warehousing", 
    "Artificial Intelligence", 
    "Machine Learning", 
    "Deep Learning"
  ];

  const getSubjectOptions = () => {
    return paperType === "GATE CS" ? getCSSubjects() : getDASubjects();
  };

  const handleNext = () => {
    if (step < getMaxSteps()) {
      setStep(step + 1);
    } else {
      // Generate test and redirect
      navigate("/instructions/custom");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/dashboard");
    }
  };

  const getMaxSteps = () => {
    if (testType === "Full Syllabus") return 3;
    if (testType === "Subject Wise") return 4;
    if (testType === "Multi-Subject Test") return 5;
    return 1;
  };

  const handleSubjectSelection = (index: number, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[index] = value;
    setSubjects(newSubjects);
  };

  // Auto-adjust time based on number of questions
  const updateTime = (questions: number) => {
    setTime(questions * 3); // 3 minutes per question
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-bold">Create Test</h1>
          </div>
          <span className="text-sm font-medium text-gray-700">{paperType}</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-xs text-gray-500 mb-4">
              Step {step} of {getMaxSteps()}
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">What type of test would you like to generate?</h2>
                <Select value={testType} onValueChange={setTestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Syllabus">Full Syllabus</SelectItem>
                    <SelectItem value="Subject Wise">Subject Wise</SelectItem>
                    <SelectItem value="Multi-Subject Test">Multi-Subject Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 2 && testType === "Full Syllabus" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Configure your test</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Number of Questions</label>
                    <Input 
                      type="number" 
                      value={numQuestions} 
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setNumQuestions(value);
                        updateTime(value);
                      }} 
                      min={1}
                      max={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 65 questions</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time (minutes)</label>
                    <Input 
                      type="number" 
                      value={time} 
                      onChange={(e) => setTime(parseInt(e.target.value))} 
                      min={1}
                      max={300}
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 3 minutes per question</p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && testType === "Subject Wise" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Select a subject</h2>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubjectOptions().map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 2 && testType === "Multi-Subject Test" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">How many subjects?</h2>
                <Select 
                  value={numSubjects.toString()} 
                  onValueChange={(val) => {
                    const num = parseInt(val);
                    setNumSubjects(num);
                    setSubjects(Array(num).fill(""));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Subject</SelectItem>
                    <SelectItem value="2">2 Subjects</SelectItem>
                    <SelectItem value="3">3 Subjects</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 3 && testType === "Subject Wise" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Configure your test</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Number of Questions</label>
                    <Input 
                      type="number" 
                      value={numQuestions} 
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setNumQuestions(value);
                        updateTime(value);
                      }}
                      min={1}
                      max={30}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time (minutes)</label>
                    <Input 
                      type="number" 
                      value={time} 
                      onChange={(e) => setTime(parseInt(e.target.value))}
                      min={1}
                      max={120}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && testType === "Multi-Subject Test" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Select subjects</h2>
                <div className="space-y-3">
                  {Array(numSubjects).fill(0).map((_, index) => (
                    <Select 
                      key={index}
                      value={subjects[index] || ""}
                      onValueChange={(value) => handleSubjectSelection(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select subject ${index + 1}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {getSubjectOptions().map((sub) => (
                          <SelectItem 
                            key={sub} 
                            value={sub}
                            disabled={subjects.includes(sub) && subjects[index] !== sub}
                          >
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && testType === "Full Syllabus" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Ready to begin</h2>
                <p>Your full syllabus test is ready with the following configuration:</p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <ul className="space-y-2">
                    <li>• Questions: {numQuestions}</li>
                    <li>• Time: {time} minutes</li>
                    <li>• Paper Type: {paperType}</li>
                  </ul>
                </div>
              </div>
            )}

            {step === 4 && testType === "Subject Wise" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Ready to begin</h2>
                <p>Your subject-specific test is ready with the following configuration:</p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <ul className="space-y-2">
                    <li>• Subject: {subject}</li>
                    <li>• Questions: {numQuestions}</li>
                    <li>• Time: {time} minutes</li>
                  </ul>
                </div>
              </div>
            )}

            {step === 4 && testType === "Multi-Subject Test" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Configure your test</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Number of Questions</label>
                    <Input 
                      type="number" 
                      value={numQuestions} 
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setNumQuestions(value);
                        updateTime(value);
                      }}
                      min={1}
                      max={60}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time (minutes)</label>
                    <Input 
                      type="number" 
                      value={time} 
                      onChange={(e) => setTime(parseInt(e.target.value))}
                      min={1}
                      max={180}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 5 && testType === "Multi-Subject Test" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Ready to begin</h2>
                <p>Your multi-subject test is ready with the following configuration:</p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <ul className="space-y-2">
                    <li>• Subjects: {subjects.join(", ")}</li>
                    <li>• Questions: {numQuestions}</li>
                    <li>• Time: {time} minutes</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                {step === 1 ? "Back to Dashboard" : "Previous"}
              </Button>
              <Button 
                onClick={handleNext}
                disabled={(step === 1 && !testType) || 
                         (step === 2 && testType === "Subject Wise" && !subject) ||
                         (step === 3 && testType === "Multi-Subject Test" && subjects.some(s => !s))}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {step === getMaxSteps() ? "Start Test" : "Next"}
                {step !== getMaxSteps() && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateTest;

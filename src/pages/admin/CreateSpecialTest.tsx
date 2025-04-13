
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { usePaper } from "@/context/PaperContext";

const CreateSpecialTest = () => {
  const navigate = useNavigate();
  const { paperType } = usePaper();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testName, setTestName] = useState("");
  const [description, setDescription] = useState("");
  const [numQuestions, setNumQuestions] = useState(30);
  const [duration, setDuration] = useState(60);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testName.trim()) {
      toast({
        title: "Error",
        description: "Test name is required",
        variant: "destructive",
      });
      return;
    }

    if (numQuestions <= 0) {
      toast({
        title: "Error",
        description: "Number of questions must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (duration <= 0) {
      toast({
        title: "Error",
        description: "Duration must be greater than 0 minutes",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create the special test document
      const testData = {
        name: testName,
        description: description,
        numQuestions: numQuestions,
        duration: duration, // in minutes
        paperType: paperType,
        createdAt: Timestamp.now(),
        questions: [], // Will be populated when questions are added to this test
      };
      
      const docRef = await addDoc(collection(db, "specialTests"), testData);
      
      toast({
        title: "Success",
        description: "Special test created successfully",
      });
      
      // Navigate to a page to add questions to this special test
      navigate(`/admin/special-test/${docRef.id}/add-questions`);
    } catch (error) {
      console.error("Error creating special test:", error);
      toast({
        title: "Error",
        description: "Failed to create special test",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-10">Create Special Test</h1>
      
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Special Test Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="testName">Test Name</Label>
              <Input
                id="testName"
                placeholder="e.g., GT-1, Mock Test 2023"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Brief description about this test"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numQuestions">Number of Questions</Label>
              <Input
                id="numQuestions"
                type="number"
                min="1"
                max="200"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="300"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                required
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Special Test"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateSpecialTest;


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { PlusCircle, Edit, Trash } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle, 
} from "@/components/ui/alert-dialog";

interface SpecialTest {
  id: string;
  name: string;
  description?: string;
  numQuestions: number;
  duration: number;
  paperType: string;
  questions: any[];
  createdAt: any;
}

const SpecialTestsList = () => {
  const navigate = useNavigate();
  const [specialTests, setSpecialTests] = useState<SpecialTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [testToDelete, setTestToDelete] = useState<SpecialTest | null>(null);
  
  useEffect(() => {
    const fetchSpecialTests = async () => {
      try {
        const q = query(collection(db, "specialTests"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const tests: SpecialTest[] = [];
        querySnapshot.forEach((doc) => {
          tests.push({
            id: doc.id,
            ...doc.data()
          } as SpecialTest);
        });
        
        setSpecialTests(tests);
      } catch (error) {
        console.error("Error fetching special tests:", error);
        toast({
          title: "Error",
          description: "Failed to load special tests",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSpecialTests();
  }, []);

  const handleDeleteTest = async () => {
    if (!testToDelete) return;
    
    try {
      await deleteDoc(doc(db, "specialTests", testToDelete.id));
      setSpecialTests(specialTests.filter(test => test.id !== testToDelete.id));
      toast({
        title: "Success",
        description: "Special test deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting test:", error);
      toast({
        title: "Error",
        description: "Failed to delete test",
        variant: "destructive",
      });
    } finally {
      setTestToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">Special Tests</h1>
        <Button onClick={() => navigate("/admin/create-special-test")}>
          <PlusCircle className="h-5 w-5 mr-1" />
          Create New Test
        </Button>
      </div>

      {loading ? (
        <div className="text-center">Loading tests...</div>
      ) : specialTests.length === 0 ? (
        <Card className="text-center p-10">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">No Special Tests Yet</h3>
            <p>Create your first special test to get started.</p>
            <Button onClick={() => navigate("/admin/create-special-test")}>Create Test</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialTests.map((test) => (
            <Card key={test.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{test.name}</CardTitle>
                {test.description && <CardDescription>{test.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Questions:</span>
                  <span className="font-medium">
                    {test.questions?.length || 0} / {test.numQuestions}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium">{test.duration} minutes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paper Type:</span>
                  <span className="font-medium">{test.paperType || "General"}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/admin/special-test/${test.id}/add-questions`)}
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setTestToDelete(test)}
                >
                  <Trash className="h-4 w-4 mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={testToDelete !== null} onOpenChange={(open) => !open && setTestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the special test "{testToDelete?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTest} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SpecialTestsList;


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Feedback } from "@/lib/types";

const FeedbacksList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const feedbacksQuery = query(
          collection(db, "feedbacks"),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(feedbacksQuery);
        const feedbacksList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Feedback[];
        
        setFeedbacks(feedbacksList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
        toast({
          title: "Error",
          description: "Failed to load feedbacks. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [toast]);

  const handleDeleteFeedback = async () => {
    if (!feedbackToDelete) return;
    
    try {
      await deleteDoc(doc(db, "feedbacks", feedbackToDelete));
      
      setFeedbacks((prev) => prev.filter((fb) => fb.id !== feedbackToDelete));
      
      toast({
        title: "Success",
        description: "Feedback deleted successfully",
      });
      
      setFeedbackToDelete(null);
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to delete feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">User Feedbacks</h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Admin Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p>Loading feedbacks...</p>
            </div>
          ) : feedbacks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-1/3">Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell className="font-medium">{feedback.name}</TableCell>
                      <TableCell>{feedback.email}</TableCell>
                      <TableCell>{feedback.message}</TableCell>
                      <TableCell>
                        {feedback.timestamp?.toDate 
                          ? feedback.timestamp.toDate().toLocaleDateString() 
                          : "Unknown date"}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFeedbackToDelete(feedback.id)}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this feedback? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-500 hover:bg-red-600"
                                onClick={handleDeleteFeedback}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p>No feedbacks found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FeedbacksList;

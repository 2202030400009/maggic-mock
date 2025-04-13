import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePaper } from "@/context/PaperContext";
import { Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Edit, Search, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
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
import { useNavigate } from "react-router-dom";

const QuestionList = () => {
  const { paperType } = usePaper();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState<"all" | "pyq" | "general">("all");
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [pyqYears, setPyqYears] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  // Fetch available PYQ years
  useEffect(() => {
    const fetchPyqYears = async () => {
      try {
        const years = [
          "2025", "2024", "2023", "2022", "2021", "2020", 
          "2019", "2018", "2017", "2016", "2015"
        ];
        setPyqYears(years);
      } catch (error) {
        console.error("Error fetching PYQ years:", error);
      }
    };

    fetchPyqYears();
  }, [paperType]);

  // Fetch questions based on the selected tab and year
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        let fetchedQuestions: Question[] = [];

        // Try to fetch questions from the 'questions' collection first (regardless of tabs)
        try {
          const generalQSnapshot = await getDocs(collection(db, "questions"));
          generalQSnapshot.forEach((doc) => {
            fetchedQuestions.push({ id: doc.id, ...doc.data() } as Question);
          });
          console.log("Fetched general questions:", fetchedQuestions.length);
        } catch (error) {
          console.log("Error fetching from 'questions' collection:", error);
        }

        // If paperType specific collection exists, get questions from there too
        if (paperType) {
          if (currentTab === "all" || currentTab === "general") {
            // Fetch general questions from paper-specific collection
            const generalCollectionName = `questions_${paperType?.replace(" ", "_")}`;
            try {
              const paperQSnapshot = await getDocs(collection(db, generalCollectionName));
              paperQSnapshot.forEach((doc) => {
                fetchedQuestions.push({ id: doc.id, ...doc.data() } as Question);
              });
              console.log(`Fetched ${paperType} questions:`, fetchedQuestions.length);
            } catch (error) {
              console.log(`Collection ${generalCollectionName} might not exist yet`, error);
            }
          }

          if ((currentTab === "all" || currentTab === "pyq") && selectedYear) {
            // Fetch PYQ questions for the selected year
            const pyqCollectionName = `pyqQuestions_${paperType?.replace(" ", "_")}_${selectedYear}`;
            try {
              const pyqQSnapshot = await getDocs(collection(db, pyqCollectionName));
              pyqQSnapshot.forEach((doc) => {
                fetchedQuestions.push({ 
                  id: doc.id, 
                  ...doc.data(),
                  paperType: selectedYear // Add year info for display
                } as Question);
              });
              console.log(`Fetched ${selectedYear} PYQ questions:`, fetchedQuestions.length);
            } catch (error) {
              console.log(`Collection ${pyqCollectionName} might not exist yet`, error);
            }
          }
        }

        setQuestions(fetchedQuestions);
        console.log("Total fetched questions:", fetchedQuestions.length);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [paperType, currentTab, selectedYear]);

  // Filter questions based on search term
  const filteredQuestions = questions.filter(
    (question) =>
      question.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get question type badge class
  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case "MCQ":
        return "bg-blue-100 text-blue-800";
      case "MSQ":
        return "bg-purple-100 text-purple-800";
      case "NAT":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete || !questionToDelete.id) return;

    try {
      // Delete from general questions collection
      await deleteDoc(doc(db, "questions", questionToDelete.id));

      // Update the local state
      setQuestions(questions.filter(q => q.id !== questionToDelete.id));

      toast({
        title: "Question Deleted",
        description: "Question has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleEditQuestion = (question: Question) => {
    sessionStorage.setItem('questionToEdit', JSON.stringify(question));
    navigate('/admin/edit-question');
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Question Bank</h1>
      
      <div className="flex items-center justify-between mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search questions..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Filter:</span>
          <Tabs 
            defaultValue="all" 
            value={currentTab}
            onValueChange={(value) => setCurrentTab(value as "all" | "pyq" | "general")}
            className="w-[400px]"
          >
            <TabsList>
              <TabsTrigger value="all">All Questions</TabsTrigger>
              <TabsTrigger value="pyq">Previous Year Questions</TabsTrigger>
              <TabsTrigger value="general">General Questions</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {(currentTab === "all" || currentTab === "pyq") && (
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="text-sm font-medium py-2">PYQ Years:</span>
          <div className="flex flex-wrap gap-2">
            {pyqYears.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
            {selectedYear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedYear(null)}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-10">Loading questions...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-10">
          {searchTerm
            ? "No questions match your search"
            : "No questions available. Please add questions from the Add Question page."}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-32">Subject</TableHead>
                <TableHead className="w-24">Marks</TableHead>
                <TableHead className="w-24">Negative</TableHead>
                <TableHead className="w-28">Paper/Year</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.map((question, index) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="max-w-md truncate">{question.text}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeBadge(question.type)}`}>
                      {question.type}
                    </span>
                  </TableCell>
                  <TableCell>{question.subject}</TableCell>
                  <TableCell>{question.marks}</TableCell>
                  <TableCell>{question.negativeMark}</TableCell>
                  <TableCell>{question.paperType || "General"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditQuestion(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          setQuestionToDelete(question);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the question from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteQuestion}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuestionList;

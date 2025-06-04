import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePaper } from "@/context/PaperContext";
import { Question } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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

import QuestionTable from "@/components/admin/question/QuestionTable";
import QuestionFilterBar from "@/components/admin/question/QuestionFilterBar";
import DuplicateQuestionManager from "@/components/admin/question/DuplicateQuestionManager";

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
  const [duplicateManagerOpen, setDuplicateManagerOpen] = useState(false);

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <Button 
          variant="destructive" 
          onClick={() => setDuplicateManagerOpen(true)}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Duplicates
        </Button>
      </div>
      
      <QuestionFilterBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        pyqYears={pyqYears}
        selectedYear={selectedYear}
        onYearSelect={setSelectedYear}
      />
      
      {loading ? (
        <div className="text-center py-10">Loading questions...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-10">
          {searchTerm
            ? "No questions match your search"
            : "No questions available. Please add questions from the Add Question page."}
        </div>
      ) : (
        <QuestionTable 
          questions={filteredQuestions}
          onEditQuestion={handleEditQuestion}
          onDeleteQuestion={(question) => {
            setQuestionToDelete(question);
            setDeleteDialogOpen(true);
          }}
        />
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

      <DuplicateQuestionManager 
        open={duplicateManagerOpen}
        onOpenChange={setDuplicateManagerOpen}
      />
    </div>
  );
};

export default QuestionList;

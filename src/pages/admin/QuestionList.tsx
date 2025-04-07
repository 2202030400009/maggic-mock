
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, deleteDoc } from "firebase/firestore";
import { usePaper } from "@/context/PaperContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Eye, 
  Trash2, 
  MoreVertical, 
  Search, 
  Filter 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Question } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gateCSSubjects, gateDASubjects } from "@/constants/subjects";

const QuestionList = () => {
  const navigate = useNavigate();
  const { paperType } = usePaper();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [collectionName, setCollectionName] = useState("questions");
  
  const subjects = paperType === "GATE CS" ? gateCSSubjects : gateDASubjects;

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(collection(db, collectionName));
        const querySnapshot = await getDocs(q);
        
        const fetchedQuestions: Question[] = [];
        querySnapshot.forEach((doc) => {
          fetchedQuestions.push({ 
            id: doc.id, 
            ...doc.data() 
          } as Question);
        });
        
        setQuestions(fetchedQuestions);
        setFilteredQuestions(fetchedQuestions);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast({
          title: "Error",
          description: "Failed to fetch questions. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [toast, collectionName]);
  
  // Apply filters
  useEffect(() => {
    let filtered = questions;
    
    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(
        q => q.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply subject filter
    if (subjectFilter) {
      filtered = filtered.filter(q => q.subject === subjectFilter);
    }
    
    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(q => q.type === typeFilter);
    }
    
    setFilteredQuestions(filtered);
  }, [searchTerm, subjectFilter, typeFilter, questions]);
  
  // Delete question
  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      
      setQuestions(prev => prev.filter(q => q.id !== id));
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Question List</h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Admin Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm mb-1">Collection</div>
                <Select
                  value={collectionName}
                  onValueChange={setCollectionName}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="questions">Regular Questions</SelectItem>
                    <SelectItem value={`pyqQuestions_${paperType?.replace(" ", "_")}_2020`}>2020 PYQ</SelectItem>
                    <SelectItem value={`pyqQuestions_${paperType?.replace(" ", "_")}_2021`}>2021 PYQ</SelectItem>
                    <SelectItem value={`pyqQuestions_${paperType?.replace(" ", "_")}_2022`}>2022 PYQ</SelectItem>
                    <SelectItem value={`pyqQuestions_${paperType?.replace(" ", "_")}_2023`}>2023 PYQ</SelectItem>
                    <SelectItem value={`pyqQuestions_${paperType?.replace(" ", "_")}_2024`}>2024 PYQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="text-sm mb-1">Search</div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div>
                <div className="text-sm mb-1">Subject</div>
                <Select
                  value={subjectFilter}
                  onValueChange={setSubjectFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="text-sm mb-1">Type</div>
                <Select
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="MCQ">MCQ</SelectItem>
                    <SelectItem value="MSQ">MSQ</SelectItem>
                    <SelectItem value="NAT">NAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between">
              <div className="text-sm text-gray-500">
                {filteredQuestions.length} questions found
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                setSearchTerm('');
                setSubjectFilter('');
                setTypeFilter('');
              }}>
                <Filter className="h-4 w-4 mr-1" />
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {loading ? (
          <div className="text-center py-8">Loading questions...</div>
        ) : filteredQuestions.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="max-w-md truncate">
                        {question.text.substring(0, 80)}
                        {question.text.length > 80 ? '...' : ''}
                      </TableCell>
                      <TableCell>
                        {question.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {question.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {question.marks}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setViewingQuestion(question)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No questions found matching your filters.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSubjectFilter('');
                setTypeFilter('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>
      
      {/* Question Preview Dialog */}
      <Dialog open={!!viewingQuestion} onOpenChange={(open) => !open && setViewingQuestion(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question Preview</DialogTitle>
            <DialogDescription>
              View question details and options
            </DialogDescription>
          </DialogHeader>
          
          {viewingQuestion && (
            <div className="space-y-4 py-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline">{viewingQuestion.subject}</Badge>
                <Badge variant="outline">{viewingQuestion.type}</Badge>
                <Badge variant="outline">{viewingQuestion.marks} mark{viewingQuestion.marks > 1 ? 's' : ''}</Badge>
                <Badge variant="outline" className="text-red-500">
                  {viewingQuestion.negativeMark} negative marks
                </Badge>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Question:</h3>
                <p className="text-gray-700">{viewingQuestion.text}</p>
              </div>
              
              {viewingQuestion.imageUrl && (
                <div>
                  <h3 className="font-medium mb-2">Image:</h3>
                  <img 
                    src={viewingQuestion.imageUrl} 
                    alt="Question" 
                    className="max-h-[200px] object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/400x200/f5f5f5/cccccc?text=Invalid+Image+URL";
                    }}
                  />
                </div>
              )}
              
              {viewingQuestion.type === "MCQ" && viewingQuestion.options && (
                <div>
                  <h3 className="font-medium mb-2">Options:</h3>
                  <div className="space-y-2">
                    {viewingQuestion.options.map((option) => (
                      <div 
                        key={option.id} 
                        className={`p-2 border rounded ${
                          option.id === viewingQuestion.correctOption
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="w-6">{option.id.toUpperCase()}.</div>
                          <div>{option.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {viewingQuestion.type === "MSQ" && viewingQuestion.options && (
                <div>
                  <h3 className="font-medium mb-2">Options:</h3>
                  <div className="space-y-2">
                    {viewingQuestion.options.map((option) => (
                      <div 
                        key={option.id} 
                        className={`p-2 border rounded ${
                          viewingQuestion.correctOptions?.includes(option.id)
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="w-6">{option.id.toUpperCase()}.</div>
                          <div>{option.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {viewingQuestion.type === "NAT" && (
                <div>
                  <h3 className="font-medium mb-2">Answer Range:</h3>
                  <p>
                    {viewingQuestion.rangeStart} to {viewingQuestion.rangeEnd}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionList;

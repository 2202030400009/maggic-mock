import { useState } from "react";
import { collection, getDocs, query, where, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePaper } from "@/context/PaperContext";
import { Question } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { gateCSSubjects, gateDASubjects } from "@/constants/subjects";
import { Trash2, Search } from "lucide-react";

interface DuplicateGroup {
  questions: (Question & { docId: string })[];
  duplicateKey: string;
}

interface DuplicateQuestionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DuplicateQuestionManager = ({ open, onOpenChange }: DuplicateQuestionManagerProps) => {
  const { paperType } = usePaper();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const subjectList = paperType === "GATE CS" ? gateCSSubjects : gateDASubjects;

  const findDuplicates = async () => {
    if (!selectedSubject) {
      toast({
        title: "Subject Required",
        description: "Please select a subject to search for duplicates.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch questions for the selected subject
      const q = query(
        collection(db, "questions"),
        where("subject", "==", selectedSubject)
      );
      
      const querySnapshot = await getDocs(q);
      const questions: (Question & { docId: string })[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        questions.push({
          id: doc.id,
          docId: doc.id,
          text: data.text || "",
          imageUrl: data.imageUrl || "",
          addedBy: data.addedBy || "",
          type: data.type,
          options: data.options || [],
          correctOption: data.correctOption,
          correctOptions: data.correctOptions,
          rangeStart: data.rangeStart,
          rangeEnd: data.rangeEnd,
          marks: data.marks || 0,
          negativeMark: data.negativeMark || 0,
          subject: data.subject || "",
        } as Question & { docId: string });
      });

      // Group questions by duplicate key (text + imageUrl + addedBy)
      const groupedQuestions = new Map<string, (Question & { docId: string })[]>();
      
      questions.forEach((question) => {
        const duplicateKey = `${question.text}|||${question.imageUrl || ''}|||${question.addedBy || ''}`;
        
        if (!groupedQuestions.has(duplicateKey)) {
          groupedQuestions.set(duplicateKey, []);
        }
        groupedQuestions.get(duplicateKey)!.push(question);
      });

      // Filter groups that have more than one question (duplicates)
      const duplicates: DuplicateGroup[] = [];
      groupedQuestions.forEach((questions, duplicateKey) => {
        if (questions.length > 1) {
          duplicates.push({
            questions,
            duplicateKey,
          });
        }
      });

      setDuplicateGroups(duplicates);
      
      if (duplicates.length === 0) {
        toast({
          title: "No Duplicates Found",
          description: `No duplicate questions found for ${selectedSubject}.`,
        });
      } else {
        toast({
          title: "Duplicates Found",
          description: `Found ${duplicates.length} group(s) of duplicate questions.`,
        });
      }
    } catch (error) {
      console.error("Error finding duplicates:", error);
      toast({
        title: "Error",
        description: "Failed to search for duplicate questions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDuplicates = async () => {
    if (duplicateGroups.length === 0) return;

    setDeleting(true);
    try {
      let totalDeleted = 0;

      for (const group of duplicateGroups) {
        // Keep the first question and delete the rest
        const questionsToDelete = group.questions.slice(1);
        
        for (const question of questionsToDelete) {
          await deleteDoc(doc(db, "questions", question.docId));
          totalDeleted++;
        }
      }

      toast({
        title: "Duplicates Deleted",
        description: `Successfully deleted ${totalDeleted} duplicate questions.`,
      });

      // Clear the duplicate groups and close dialog
      setDuplicateGroups([]);
      setSelectedSubject("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting duplicates:", error);
      toast({
        title: "Error",
        description: "Failed to delete duplicate questions.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setDuplicateGroups([]);
    setSelectedSubject("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delete Duplicate Questions</DialogTitle>
          <DialogDescription>
            Select a subject to search for duplicate questions. Questions are considered duplicates 
            if they have the same text, image URL, and added by field.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjectList.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={findDuplicates} 
              disabled={loading || !selectedSubject}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {loading ? "Searching..." : "Find Duplicates"}
            </Button>
          </div>

          {duplicateGroups.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Found {duplicateGroups.length} group(s) of duplicate questions:
              </h3>
              
              <div className="space-y-6">
                {duplicateGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="border rounded-lg p-4 bg-red-50">
                    <h4 className="font-medium text-red-800 mb-2">
                      Duplicate Group {groupIndex + 1} ({group.questions.length} questions)
                    </h4>
                    <div className="space-y-2">
                      {group.questions.map((question, index) => (
                        <div key={question.docId} className="text-sm p-2 bg-white rounded border">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">Question {index + 1}:</p>
                              <p className="text-gray-700 truncate max-w-md">
                                {question.text}
                              </p>
                              {question.imageUrl && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Has image: {question.imageUrl.substring(0, 50)}...
                                </p>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 ml-4">
                              <p>Doc ID: {question.docId}</p>
                              <p>Added by: {question.addedBy || 'Unknown'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      Note: The first question will be kept, others will be deleted.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {duplicateGroups.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={deleteDuplicates}
              disabled={deleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete Duplicates"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateQuestionManager;


import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileDown } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface TestResponse {
  id: string;
  userId: string;
  userEmail: string;
  testType: string;
  paperType: string;
  year: string | null;
  totalMarks: number;
  scoredMarks: number;
  scaledMarks: number;
  lossMarks: number;
  timestamp: any;
  totalTime: number;
}

const TestResponsesList = () => {
  const [responses, setResponses] = useState<TestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResponses = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "testResponses"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        const fetchedResponses: TestResponse[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedResponses.push({
            id: doc.id,
            userId: data.userId,
            userEmail: data.userEmail,
            testType: data.testType,
            paperType: data.paperType,
            year: data.year,
            totalMarks: data.totalMarks,
            scoredMarks: data.scoredMarks,
            scaledMarks: data.scaledMarks,
            lossMarks: data.lossMarks,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
            totalTime: data.totalTime,
          });
        });
        
        setResponses(fetchedResponses);
      } catch (error) {
        console.error("Error fetching test responses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredResponses = responses.filter(
    (response) =>
      response.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.paperType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (response.year && response.year.includes(searchTerm))
  );

  const viewResponseDetails = (response: TestResponse) => {
    // For now, just storing the selected response ID in session storage
    // This could be expanded to show a detailed view page
    sessionStorage.setItem('adminViewResponseId', response.id);
    navigate(`/admin/response/${response.id}`);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Test Responses</h1>
      
      <div className="flex items-center justify-between mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search responses..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">Loading responses...</div>
      ) : filteredResponses.length === 0 ? (
        <div className="text-center py-10">
          {searchTerm ? "No responses match your search" : "No test responses available yet."}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Paper Type</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Time Taken</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResponses.map((response, index) => (
                <TableRow key={response.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="max-w-xs truncate">{response.userEmail}</TableCell>
                  <TableCell>{response.paperType}</TableCell>
                  <TableCell>{response.testType === "PYQ" ? response.year : "N/A"}</TableCell>
                  <TableCell className="text-right">
                    {response.scoredMarks}/{response.totalMarks} ({Math.round((response.scoredMarks / response.totalMarks) * 100)}%)
                  </TableCell>
                  <TableCell>{formatTime(response.totalTime)}</TableCell>
                  <TableCell>
                    {response.timestamp instanceof Date
                      ? format(response.timestamp, "dd MMM yyyy, HH:mm")
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => viewResponseDetails(response)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TestResponsesList;

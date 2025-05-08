
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TestHistory {
  id: string;
  testType: string;
  paperType: string;
  year: string | null;
  totalMarks: number;
  scoredMarks: number;
  scaledMarks: number;
  timestamp: Date;
  totalTime: number;
}

const Profile = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [testHistory, setTestHistory] = useState<TestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tests");

  useEffect(() => {
    const fetchTestHistory = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        console.log("Fetching test history for user:", currentUser.uid);
        const q = query(
          collection(db, "testResponses"), 
          where("userId", "==", currentUser.uid),
          orderBy("timestamp", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const history: TestHistory[] = [];
        
        console.log("Query snapshot size:", querySnapshot.size);
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Processing test response doc:", doc.id, data);
          
          // Safely handle timestamp field
          let timestamp;
          if (data.timestamp) {
            if (data.timestamp.toDate) {
              timestamp = data.timestamp.toDate();
            } else if (data.timestamp instanceof Date) {
              timestamp = data.timestamp;
            } else {
              timestamp = new Date();
            }
          } else {
            timestamp = new Date();
          }
          
          history.push({
            id: doc.id,
            testType: data.testType || "Unknown",
            paperType: data.paperType || "Unknown",
            year: data.year || null,
            totalMarks: data.totalMarks || 0,
            scoredMarks: data.scoredMarks || 0,
            scaledMarks: data.scaledMarks || 0,
            timestamp: timestamp,
            totalTime: data.totalTime || 0
          });
        });
        
        console.log("Fetched test history:", history);
        setTestHistory(history);
      } catch (error) {
        console.error("Error fetching test history:", error);
        toast({
          title: "Error",
          description: "Failed to load test history. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTestHistory();
  }, [currentUser, toast]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const viewTestResult = (testId: string) => {
    // We'll need to fetch the specific test result and put it in session storage
    // Then navigate to result page
    const getTestDetails = async () => {
      try {
        // Fetch the test details from Firestore
        const q = query(collection(db, "testResponses"), where("__name__", "==", testId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const testData = querySnapshot.docs[0].data();
          
          // Store in session storage for result page
          sessionStorage.setItem('testResults', JSON.stringify({
            rawMarks: testData.scoredMarks,
            lossMarks: testData.lossMarks,
            actualMarks: testData.scoredMarks,
            scaledMarks: testData.scaledMarks,
            totalMarks: testData.totalMarks,
            subjectPerformance: testData.subjectPerformance || [],
            weakSubjects: testData.weakSubjects || [],
            testResponseId: testId,
            questions: testData.questions || [],
            userAnswers: testData.questions?.map((q: any) => q.userAnswer) || [],
            paperType: testData.paperType
          }));
          
          // Navigate to the result page
          navigate('/result');
        } else {
          toast({
            title: "Test not found",
            description: "Could not find the test details. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading test details:", error);
        toast({
          title: "Error",
          description: "Failed to load test details. Please try again.",
          variant: "destructive",
        });
      }
    };

    getTestDetails();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-10">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">My Profile</h1>
                {currentUser && (
                  <p className="text-gray-600">{currentUser.email}</p>
                )}
              </div>
              <Button onClick={handleLogout} variant="outline">Logout</Button>
            </div>
            
            <Separator className="my-6" />
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="tests">Test History</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tests">
                <div className="space-y-6">
                  {loading ? (
                    <div className="text-center py-10">
                      <p>Loading test history...</p>
                    </div>
                  ) : testHistory.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">You haven't taken any tests yet.</p>
                      <Button onClick={() => navigate('/dashboard')} className="mt-4">
                        Go to Dashboard
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Paper Type</TableHead>
                            <TableHead>Test Type</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                            <TableHead>Time Taken</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {testHistory.map((test, index) => (
                            <TableRow key={test.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{test.paperType}</TableCell>
                              <TableCell>
                                {test.testType === "PYQ" 
                                  ? `${test.year} PYQ` 
                                  : "Practice Test"}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-medium">
                                  {test.scoredMarks}/{test.totalMarks}
                                </span>
                                <span className="text-sm text-gray-500 ml-2">
                                  ({Math.round((test.scoredMarks / test.totalMarks) * 100)}%)
                                </span>
                              </TableCell>
                              <TableCell>{formatTime(test.totalTime)}</TableCell>
                              <TableCell>
                                {format(test.timestamp, "dd MMM yyyy, HH:mm")}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button 
                                  size="sm"
                                  variant="ghost"
                                  className="text-indigo-600 hover:text-indigo-800"
                                  onClick={() => viewTestResult(test.id)}
                                >
                                  View Result
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="settings">
                <div className="space-y-6 py-4">
                  <h3 className="text-lg font-medium">User Information</h3>
                  <p className="text-gray-600">
                    Email: {currentUser?.email}
                  </p>
                  <p className="text-gray-600">
                    Account created: {currentUser?.metadata.creationTime ? 
                      format(new Date(currentUser.metadata.creationTime), "dd MMM yyyy") : "N/A"}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

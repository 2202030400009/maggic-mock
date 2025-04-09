
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlus, FileText, List, MessageSquare } from "lucide-react";

const AdminDashboard = () => {
  const [questionCount, setQuestionCount] = useState(0);
  const [testResponsesCount, setTestResponsesCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get question count
        const questionSnapshot = await getDocs(collection(db, "questions"));
        setQuestionCount(questionSnapshot.size);

        // Get test responses count
        const responsesSnapshot = await getDocs(collection(db, "testResponses"));
        setTestResponsesCount(responsesSnapshot.size);

        // Get feedback count
        const feedbackSnapshot = await getDocs(collection(db, "feedback"));
        setFeedbackCount(feedbackSnapshot.size);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-10">Admin Dashboard</h1>

      {loading ? (
        <div className="text-center">Loading dashboard data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Questions
                </CardTitle>
                <FileText className="h-5 w-5 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{questionCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Test Attempts
                </CardTitle>
                <List className="h-5 w-5 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{testResponsesCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Feedbacks
                </CardTitle>
                <MessageSquare className="h-5 w-5 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{feedbackCount}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/admin/add-question">
              <Button variant="outline" className="w-full h-24">
                <div className="flex flex-col items-center">
                  <FilePlus className="h-6 w-6 mb-2" />
                  <span>Add Question</span>
                </div>
              </Button>
            </Link>
            <Link to="/admin/questions">
              <Button variant="outline" className="w-full h-24">
                <div className="flex flex-col items-center">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Question Bank</span>
                </div>
              </Button>
            </Link>
            <Link to="/admin/test-responses">
              <Button variant="outline" className="w-full h-24">
                <div className="flex flex-col items-center">
                  <List className="h-6 w-6 mb-2" />
                  <span>Test Responses</span>
                </div>
              </Button>
            </Link>
            <Link to="/admin/feedbacks">
              <Button variant="outline" className="w-full h-24">
                <div className="flex flex-col items-center">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  <span>Feedbacks</span>
                </div>
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

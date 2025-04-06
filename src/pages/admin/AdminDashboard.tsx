
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, MessageSquare, FileText, TrendingUp, Plus, List } from "lucide-react";
import { AdminStats } from "@/lib/types";

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalFeedbacks: 0,
    totalTests: 0,
    averageScore: 0
  });
  const [recentFeedbacks, setRecentFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total users count
        const usersSnapshot = await getDocs(collection(db, "users"));
        const totalUsers = usersSnapshot.size;

        // Get feedbacks
        const feedbacksQuery = query(
          collection(db, "feedbacks"),
          orderBy("timestamp", "desc"),
          limit(5)
        );
        const feedbacksSnapshot = await getDocs(feedbacksQuery);
        const feedbacks = feedbacksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const totalFeedbacks = feedbacksSnapshot.size;

        // Get tests data
        const testsSnapshot = await getDocs(collection(db, "testResponses"));
        const totalTests = testsSnapshot.size;
        
        // Calculate average score
        let totalScore = 0;
        testsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          totalScore += data.scoredMarks || 0;
        });
        const averageScore = totalTests > 0 ? Math.round(totalScore / totalTests) : 0;

        setStats({
          totalUsers,
          totalFeedbacks,
          totalTests,
          averageScore
        });
        setRecentFeedbacks(feedbacks);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              User Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium text-gray-500">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-indigo-500 mr-2" />
                <span className="text-3xl font-bold">{stats.totalUsers}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium text-gray-500">Total Feedbacks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-amber-500 mr-2" />
                <span className="text-3xl font-bold">{stats.totalFeedbacks}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium text-gray-500">Tests Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-3xl font-bold">{stats.totalTests}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium text-gray-500">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-3xl font-bold">{stats.averageScore}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button onClick={() => navigate("/admin/add-question")} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
          <Button onClick={() => navigate("/admin/feedbacks")} variant="outline">
            <List className="mr-2 h-4 w-4" /> View All Feedbacks
          </Button>
        </div>
        
        {/* Recent Feedbacks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Feedbacks</h2>
          
          {loading ? (
            <p className="text-center py-4">Loading recent feedbacks...</p>
          ) : recentFeedbacks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentFeedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell className="font-medium">{feedback.name}</TableCell>
                    <TableCell>{feedback.email}</TableCell>
                    <TableCell className="max-w-xs truncate">{feedback.message}</TableCell>
                    <TableCell>
                      {feedback.timestamp?.toDate 
                        ? feedback.timestamp.toDate().toLocaleDateString() 
                        : "Unknown date"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-4">No feedbacks found</p>
          )}
          
          {recentFeedbacks.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => navigate("/admin/feedbacks")}>
                View All
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

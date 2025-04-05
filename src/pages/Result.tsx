
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, TrendingDown, Award } from "lucide-react";

const Result = () => {
  const navigate = useNavigate();

  // Mock results data
  const results = {
    rawMarks: 110,
    lossMarks: 15,
    actualMarks: 95,
    totalMarks: 180,
    weakSubjects: ["Computer Networking", "Database", "Theory of Computation"],
    subjectPerformance: [
      { subject: "Aptitude", total: 15, scored: 12, attempted: 5, totalQuestions: 5, percentage: 80 },
      { subject: "Engineering Maths", total: 15, scored: 9, attempted: 5, totalQuestions: 5, percentage: 60 },
      { subject: "Database", total: 15, scored: 6, attempted: 5, totalQuestions: 5, percentage: 40 },
      { subject: "Computer Networking", total: 15, scored: 5, attempted: 5, totalQuestions: 5, percentage: 33 },
      { subject: "Operating System", total: 15, scored: 10, attempted: 5, totalQuestions: 5, percentage: 67 },
      { subject: "Theory of Computation", total: 15, scored: 7, attempted: 5, totalQuestions: 5, percentage: 47 },
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center">
            <Award className="h-5 w-5 mr-2 text-indigo-600" />
            Test Results
          </h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium text-gray-500">Raw Marks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <span className="text-3xl font-bold">{results.rawMarks}</span>
                <span className="text-gray-500 ml-1">/ {results.totalMarks}</span>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500 mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium text-gray-500">Loss Marks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-red-500">-{results.lossMarks}</span>
              </div>
              <TrendingDown className="h-5 w-5 text-red-500 mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium text-gray-500">Final Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <span className="text-3xl font-bold">{results.actualMarks}</span>
                <span className="text-gray-500 ml-1">/ {results.totalMarks}</span>
                <span className="ml-2 text-gray-500">
                  ({Math.round((results.actualMarks / results.totalMarks) * 100)}%)
                </span>
              </div>
              <Progress
                className="mt-2"
                value={(results.actualMarks / results.totalMarks) * 100}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weak Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {results.weakSubjects.map((subject, index) => (
                    <li key={index} className="flex items-center p-2 bg-red-50 rounded-md">
                      <div className="w-1 h-8 bg-red-500 rounded-full mr-3"></div>
                      <span>{subject}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subject Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Subject</th>
                        <th className="text-center py-2 px-2">Total Marks</th>
                        <th className="text-center py-2 px-2">Scored</th>
                        <th className="text-center py-2 px-2">Attempted</th>
                        <th className="text-center py-2 px-2">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.subjectPerformance.map((subject, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 px-2">{subject.subject}</td>
                          <td className="text-center py-3 px-2">{subject.total}</td>
                          <td className="text-center py-3 px-2">{subject.scored}</td>
                          <td className="text-center py-3 px-2">
                            {subject.attempted}/{subject.totalQuestions}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-center">
                              <Progress
                                className="h-2 w-24"
                                value={subject.percentage}
                              />
                              <span className="ml-2 text-xs">{subject.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
        </div>
      </main>
    </div>
  );
};

export default Result;

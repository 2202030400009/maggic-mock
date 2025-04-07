
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, TrendingDown, Award } from "lucide-react";

interface SubjectPerformance {
  subject: string;
  total: number;
  scored: number;
  attempted: number;
  totalQuestions: number;
  percentage: number;
}

interface TestResult {
  rawMarks: number;
  lossMarks: number;
  actualMarks: number;
  scaledMarks: number;
  totalMarks: number;
  subjectPerformance: SubjectPerformance[];
  weakSubjects: string[];
  testResponseId?: string;
}

const Result = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load test results from session storage
    const storedResults = sessionStorage.getItem('testResults');
    
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
      } catch (error) {
        console.error("Error parsing test results:", error);
      }
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading results...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl mb-4">No test results found</p>
        <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
      </div>
    );
  }

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
                <span className="text-3xl font-bold">{results.scaledMarks}</span>
                <span className="text-gray-500 ml-1">/ 100</span>
                <span className="ml-2 text-gray-500">
                  ({Math.round((results.scaledMarks / 100) * 100)}%)
                </span>
              </div>
              <Progress
                className="mt-2"
                value={(results.scaledMarks / 100) * 100}
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
                {results.weakSubjects && results.weakSubjects.length > 0 ? (
                  <ul className="space-y-2">
                    {results.weakSubjects.map((subject, index) => (
                      <li key={index} className="flex items-center p-2 bg-red-50 rounded-md">
                        <div className="w-1 h-8 bg-red-500 rounded-full mr-3"></div>
                        <span>{subject}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center py-4">No weak subjects identified. Great job!</p>
                )}
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

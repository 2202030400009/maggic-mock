
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SubjectPerformanceProps {
  subjectPerformance: {
    subject: string;
    total: number;
    scored: number;
    attempted: number;
    totalQuestions: number;
    percentage: number;
  }[];
}

const SubjectPerformance = ({ subjectPerformance }: SubjectPerformanceProps) => {
  return (
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
              {subjectPerformance.map((subject, index) => (
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
  );
};

export default SubjectPerformance;

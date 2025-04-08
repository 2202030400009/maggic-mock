
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ResultSummaryCardsProps {
  rawMarks: number;
  lossMarks: number;
  scaledMarks: number;
  totalMarks: number;
}

const ResultSummaryCards = ({
  rawMarks,
  lossMarks,
  scaledMarks,
  totalMarks
}: ResultSummaryCardsProps) => {
  const displayTotal = totalMarks === 65 ? 100 : totalMarks;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium text-gray-500">Raw Marks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end">
            <span className="text-3xl font-bold">{rawMarks}</span>
            <span className="text-gray-500 ml-1">/ {totalMarks}</span>
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
            <span className="text-3xl font-bold text-red-500">-{lossMarks}</span>
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
            <span className="text-3xl font-bold">{scaledMarks}</span>
            <span className="text-gray-500 ml-1">
              {totalMarks === 65 ? "/ 100" : `/ ${totalMarks}`}
            </span>
            <span className="ml-2 text-gray-500">
              ({Math.round((scaledMarks / displayTotal) * 100)}%)
            </span>
          </div>
          <Progress
            className="mt-2"
            value={(scaledMarks / displayTotal) * 100}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultSummaryCards;

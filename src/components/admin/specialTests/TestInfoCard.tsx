
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TestInfoCardProps {
  name: string;
  description?: string;
  questionCount: number;
  questionLimit: number;
  duration: number;
  isLimitReached: boolean;
}

const TestInfoCard: React.FC<TestInfoCardProps> = ({
  name,
  description,
  questionCount,
  questionLimit,
  duration,
  isLimitReached
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Information</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Test Name</dt>
            <dd className="text-lg">{name}</dd>
          </div>
          {description && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd>{description}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">Questions</dt>
            <dd>
              <span className="text-lg font-medium">{questionCount}</span>
              <span className={`text-sm ml-1 ${isLimitReached ? "text-red-500 font-medium" : "text-gray-500"}`}>
                / {questionLimit}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Duration</dt>
            <dd>{duration} minutes</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};

export default TestInfoCard;

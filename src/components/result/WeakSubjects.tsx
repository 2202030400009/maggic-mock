
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeakSubjectsProps {
  weakSubjects: string[];
}

const WeakSubjects = ({ weakSubjects }: WeakSubjectsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Weak Subjects</CardTitle>
      </CardHeader>
      <CardContent>
        {weakSubjects && weakSubjects.length > 0 ? (
          <ul className="space-y-2">
            {weakSubjects.map((subject, index) => (
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
  );
};

export default WeakSubjects;

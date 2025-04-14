
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface QuestionFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  currentTab: "all" | "pyq" | "general";
  onTabChange: (value: "all" | "pyq" | "general") => void;
  pyqYears: string[];
  selectedYear: string | null;
  onYearSelect: (year: string | null) => void;
}

const QuestionFilterBar: React.FC<QuestionFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  currentTab,
  onTabChange,
  pyqYears,
  selectedYear,
  onYearSelect,
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search questions..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Filter:</span>
          <Tabs 
            defaultValue="all" 
            value={currentTab}
            onValueChange={(value) => onTabChange(value as "all" | "pyq" | "general")}
            className="w-[400px]"
          >
            <TabsList>
              <TabsTrigger value="all">All Questions</TabsTrigger>
              <TabsTrigger value="pyq">Previous Year Questions</TabsTrigger>
              <TabsTrigger value="general">General Questions</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {(currentTab === "all" || currentTab === "pyq") && (
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="text-sm font-medium py-2">PYQ Years:</span>
          <div className="flex flex-wrap gap-2">
            {pyqYears.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                size="sm"
                onClick={() => onYearSelect(year)}
              >
                {year}
              </Button>
            ))}
            {selectedYear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onYearSelect(null)}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default QuestionFilterBar;


import { Button } from "@/components/ui/button";
import { usePaper } from "@/context/PaperContext";
import { ArrowLeftRight } from "lucide-react";

const PaperSwitcher = () => {
  const { paperType, togglePaperType } = usePaper();
  
  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={togglePaperType}
    >
      <ArrowLeftRight className="h-4 w-4" />
      <span className="hidden sm:inline">Switch to</span>
      {paperType === "GATE CS" ? "GATE DA" : "GATE CS"}
    </Button>
  );
};

export default PaperSwitcher;

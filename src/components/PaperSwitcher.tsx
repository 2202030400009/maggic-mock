
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePaper } from "@/context/PaperContext";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PaperSwitcher = () => {
  const { paperType, togglePaperType } = usePaper();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleTogglePaper = () => {
    setIsLoading(true);
    
    // Show toast for better UX
    const newType = paperType === "GATE CS" ? "GATE DA" : "GATE CS";
    toast({
      title: `Switching to ${newType}`,
      description: "Please wait while we update your dashboard...",
    });
    
    // Simulate loading for better UX
    setTimeout(() => {
      togglePaperType();
      setIsLoading(false);
    }, 800);
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={handleTogglePaper}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ArrowLeftRight className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Switch to</span>
      {paperType === "GATE CS" ? "GATE DA" : "GATE CS"}
    </Button>
  );
};

export default PaperSwitcher;

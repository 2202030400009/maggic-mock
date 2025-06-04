
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePaper } from "@/context/PaperContext";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PaperSwitcher = () => {
  const { paperType, togglePaperType } = usePaper();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  
  const handleTogglePaper = () => {
    setIsLoading(true);
    
    const newType = paperType === "GATE CS" ? "GATE DA" : "GATE CS";
    setLoadingText(`Switching to ${newType}...`);
    
    // Show toast for better UX
    toast({
      title: `Switching to ${newType}`,
      description: "Please wait while we update your dashboard...",
    });
    
    // Simulate loading with progress updates for better UX
    setTimeout(() => {
      setLoadingText(`Loading ${newType} content...`);
      
      setTimeout(() => {
        setLoadingText(`Updating dashboard...`);
        
        setTimeout(() => {
          togglePaperType();
          setIsLoading(false);
        }, 300);
      }, 300);
    }, 400);
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
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">{loadingText}</span>
        </>
      ) : (
        <>
          <ArrowLeftRight className="h-4 w-4" />
          <span className="hidden sm:inline">Switch to</span>
          {paperType === "GATE CS" ? "DA" : "CS"}
        </>
      )}
    </Button>
  );
};

export default PaperSwitcher;

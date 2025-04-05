
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePaper } from "@/context/PaperContext";

const PaperSelection = () => {
  const [open, setOpen] = useState(true);
  const { paperType, setPaperType } = usePaper();
  const navigate = useNavigate();

  useEffect(() => {
    if (paperType) {
      navigate("/dashboard");
    }
  }, [paperType, navigate]);

  const handleSelectPaper = (type: "GATE CS" | "GATE DA") => {
    setPaperType(type);
    setOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <div className="text-center space-y-6 py-6">
            <h2 className="text-2xl font-bold tracking-tight">Select Your Paper</h2>
            <p className="text-gray-500">
              Choose the paper type that you want to practice for. This selection will personalize your experience.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button
                onClick={() => handleSelectPaper("GATE CS")}
                className="h-32 bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white text-lg"
              >
                GATE CS
              </Button>
              <Button
                onClick={() => handleSelectPaper("GATE DA")}
                className="h-32 bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white text-lg"
              >
                GATE DA
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaperSelection;

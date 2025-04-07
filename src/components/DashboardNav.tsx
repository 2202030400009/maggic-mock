
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePaper } from "@/context/PaperContext";
import PaperSwitcher from "@/components/PaperSwitcher";
import { User, LogOut } from "lucide-react";

const DashboardNav = () => {
  const { currentUser, signOut } = useAuth();
  const { paperType } = usePaper();
  const navigate = useNavigate();
  
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">
            {paperType} Dashboard
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <PaperSwitcher />
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/profile")}
            className="gap-2"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => signOut()}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardNav;

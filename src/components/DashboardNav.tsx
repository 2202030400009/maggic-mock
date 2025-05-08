
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Book, LogOut, Settings, User, BookOpen, ArrowLeftRight } from "lucide-react";
import { usePaper } from "@/context/PaperContext";
import PaperSwitcher from "./PaperSwitcher";

const DashboardNav = () => {
  const [pending, setPending] = useState(false);
  const { currentUser, signOut } = useAuth();
  const { paperType } = usePaper();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      setPending(true);
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setPending(false);
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 font-bold text-gray-800 text-xl"
            >
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <span>
                MagGIC <span className="text-indigo-600">Mock</span>
              </span>
            </Link>
            
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/dashboard' 
                    ? 'text-indigo-700 bg-indigo-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                to="/create-test"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/create-test' 
                    ? 'text-indigo-700 bg-indigo-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Create Test
              </Link>
              <Link 
                to="/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/profile' 
                    ? 'text-indigo-700 bg-indigo-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="inline-block h-4 w-4 mr-1" />
                Profile
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-600">
              {paperType || "Select Paper"}
            </div>
            
            <PaperSwitcher />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={currentUser?.photoURL || ""}
                      alt={currentUser?.displayName || ""}
                    />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700">
                      {currentUser?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link to="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link to="/create-test">
                  <DropdownMenuItem className="cursor-pointer">
                    <Book className="mr-2 h-4 w-4" />
                    <span>Create Test</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={pending}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{pending ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardNav;

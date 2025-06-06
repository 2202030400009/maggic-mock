
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePaper } from "@/context/PaperContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Settings, LogOut, Shield, BrainCircuit } from "lucide-react";
import FeedbackButton from "@/components/FeedbackButton";
import PaperSwitcher from "@/components/PaperSwitcher";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlusCircle } from "lucide-react";
import DashboardNav from "@/components/DashboardNav"; 


const YearPaperCard = ({ year, paperType }: { year: number; paperType: string }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{paperType} {year}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <CardDescription className="space-y-1">
          <p>65 Questions</p>
          <p>100 Marks</p>
          <p>Full Length Paper</p>
        </CardDescription>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => navigate(`/instructions/${year}`)}
        >
          Start Test
        </Button>
      </CardFooter>
    </Card>
  );
};

interface SpecialTest {
  id: string;
  name: string;
  description?: string;
  numQuestions: number;
  duration: number;
  paperType: string;
}

const SpecialTestCard = ({ test }: { test: SpecialTest }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{test.name}</CardTitle>
        {test.description && <CardDescription>{test.description}</CardDescription>}
      </CardHeader>
      <CardContent className="pb-2">
        <CardDescription className="space-y-1">
          <p>{test.numQuestions} Questions</p>
          <p>{test.duration} Minutes</p>
          <p>Special Test</p>
        </CardDescription>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => navigate(`/instructions/special/${test.id}`)}
        >
          Start Test
        </Button>
      </CardFooter>
    </Card>
  );
};

const Dashboard = () => {
  const { signOut, isAdmin } = useAuth();
  const { paperType } = usePaper();
  const navigate = useNavigate();
  const [specialTests, setSpecialTests] = useState<SpecialTest[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate years from 2025 down to 2015
  const years = Array.from({ length: 11 }, (_, i) => 2025 - i);
  
  // Fetch special tests
  useEffect(() => {
    const fetchSpecialTests = async () => {
      try {
        // Only fetch special tests for the current paper type
        const q = query(
          collection(db, "specialTests"),
          where("paperType", "==", paperType)
        );
        
        const querySnapshot = await getDocs(q);
        const tests: SpecialTest[] = [];
        
        querySnapshot.forEach((doc) => {
          tests.push({
            id: doc.id,
            ...doc.data()
          } as SpecialTest);
        });
        
        setSpecialTests(tests);
      } catch (error) {
        console.error("Error fetching special tests:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (paperType) {
      fetchSpecialTests();
    }
  }, [paperType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-bold">MaggicMock</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <PaperSwitcher />
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                <Shield className="h-4 w-4 mr-1" /> Admin
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate("/create-test")}>
                <PlusCircle className="h-4 w-4 mr-1" /> Create Test
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header> */}

      <DashboardNav/>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <FileText className="h-6 w-6 mr-2 text-indigo-600" />
              Previous Year Papers
            </h2>
            <FeedbackButton />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {years.map((year) => (
              <YearPaperCard key={year} year={year} paperType={paperType || ""} />
            ))}
          </div>
        </section>

        {/* Special Tests Section */}
        {specialTests.length > 0 && (
          <>
            <Separator className="my-8" />
            
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <BrainCircuit className="h-6 w-6 mr-2 text-indigo-600" />
                  Special Tests
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {specialTests.map((test) => (
                  <SpecialTestCard key={test.id} test={test} />
                ))}
              </div>
            </section>
          </>
        )}

        <Separator className="my-8" />

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <Settings className="h-6 w-6 mr-2 text-indigo-600" />
              Create Personalized Test
            </h2>
          </div>
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Tailor Your Test Experience</h3>
                <p>Create a personalized test based on your preferences and study needs.</p>
                <Button 
                  className="bg-white text-indigo-700 hover:bg-gray-100" 
                  size="lg"
                  onClick={() => navigate("/create-test")}
                >
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

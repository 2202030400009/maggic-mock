
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PaperProvider } from "@/context/PaperContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Login from "./pages/Login";
import PaperSelection from "./pages/PaperSelection";
import Dashboard from "./pages/Dashboard";
import Instructions from "./pages/Instructions";
import Test from "./pages/Test";
import Result from "./pages/Result";
import CreateTest from "./pages/CreateTest";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AddQuestion from "./pages/admin/AddQuestion";
import QuestionList from "./pages/admin/QuestionList";
import FeedbacksList from "./pages/admin/FeedbacksList";
import TestResponsesList from "./pages/admin/TestResponsesList";
import CreateSpecialTest from "./pages/admin/CreateSpecialTest";
import SpecialTestsList from "./pages/admin/SpecialTestsList";
import SpecialTestAddQuestions from "./pages/admin/SpecialTestAddQuestions";
import NotFound from "./pages/NotFound";
import PyqQuestionCreate from './pages/admin/PyqQuestionCreate';
import EditQuestion from './pages/admin/EditQuestion';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PaperProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Login />} />
              
              <Route path="/paper-selection" element={
                <ProtectedRoute>
                  <PaperSelection />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              <Route path="/instructions/:year" element={
                <ProtectedRoute>
                  <Instructions />
                </ProtectedRoute>
              } />
              
              <Route path="/instructions/special/:testId" element={
                <ProtectedRoute>
                  <Instructions />
                </ProtectedRoute>
              } />
              
              <Route path="/test/:year" element={
                <ProtectedRoute>
                  <Test />
                </ProtectedRoute>
              } />
              
              <Route path="/test/special/:testId" element={
                <ProtectedRoute>
                  <Test />
                </ProtectedRoute>
              } />
              
              <Route path="/result" element={
                <ProtectedRoute>
                  <Result />
                </ProtectedRoute>
              } />
              
              <Route path="/create-test" element={
                <ProtectedRoute>
                  <CreateTest />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              
              <Route path="/admin/add-question" element={
                <AdminRoute>
                  <AddQuestion />
                </AdminRoute>
              } />
              
              <Route path="/admin/add-pyq-question" element={
                <AdminRoute>
                  <PyqQuestionCreate />
                </AdminRoute>
              } />
              
              <Route path="/admin/edit-question/:questionId" element={
                <AdminRoute>
                  <EditQuestion />
                </AdminRoute>
              } />
              
              <Route path="/admin/questions" element={
                <AdminRoute>
                  <QuestionList />
                </AdminRoute>
              } />
              
              <Route path="/admin/special-tests" element={
                <AdminRoute>
                  <SpecialTestsList />
                </AdminRoute>
              } />
              
              <Route path="/admin/create-special-test" element={
                <AdminRoute>
                  <CreateSpecialTest />
                </AdminRoute>
              } />
              
              <Route path="/admin/special-test/:testId/add-questions" element={
                <AdminRoute>
                  <SpecialTestAddQuestions />
                </AdminRoute>
              } />
              
              <Route path="/admin/feedbacks" element={
                <AdminRoute>
                  <FeedbacksList />
                </AdminRoute>
              } />
              
              <Route path="/admin/test-responses" element={
                <AdminRoute>
                  <TestResponsesList />
                </AdminRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PaperProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;


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
import AdminDashboard from "./pages/admin/AdminDashboard";
import AddQuestion from "./pages/admin/AddQuestion";
import FeedbacksList from "./pages/admin/FeedbacksList";
import NotFound from "./pages/NotFound";

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
              
              <Route path="/instructions/:year" element={
                <ProtectedRoute>
                  <Instructions />
                </ProtectedRoute>
              } />
              
              <Route path="/test/:year" element={
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
              
              <Route path="/admin/feedbacks" element={
                <AdminRoute>
                  <FeedbacksList />
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

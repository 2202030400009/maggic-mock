import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from "@/components/theme-provider"
import { useAuth } from './context/AuthContext';
import { Toaster } from "@/components/ui/toaster"

// Public Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Instructions from './pages/Instructions';
import Test from './pages/Test';
import Result from './pages/Result';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Contact from './pages/pages/Contact';
import About from './pages/pages/About';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import QuestionList from './pages/admin/QuestionList';
import TestResponsesList from './pages/admin/TestResponsesList';
import AddQuestion from './pages/admin/AddQuestion';
import EditQuestion from './pages/admin/EditQuestion';
import FeedbacksList from './pages/admin/FeedbacksList';
import SpecialTestsList from './pages/admin/SpecialTestsList';
import CreateSpecialTest from './pages/admin/CreateSpecialTest';
import SpecialTestAddQuestions from './pages/admin/SpecialTestAddQuestions';
import TestResponseView from './pages/admin/TestResponseView';

// Protected Route Component
const ProtectedRoute = ({ children }: any) => {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

// Admin Route Component
const AdminRoute = ({ children }: any) => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser && currentUser.email === process.env.REACT_APP_ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, [currentUser]);

  if (loading) {
    return <div>Loading...</div>; // You can replace this with a spinner or loading indicator
  }

  return isAdmin ? <>{children}</> : <Navigate to="/" />;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  const pageVariants = {
    initial: {
      opacity: 0,
      x: "-100vw",
      scale: 0.8
    },
    in: {
      opacity: 1,
      x: 0,
      scale: 1
    },
    out: {
      opacity: 0,
      x: "100vw",
      scale: 1.2
    }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  return (
    <AnimatePresence initial={false} mode='wait' >
      <Routes key={location.pathname} location={location}>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/test" element={<Test />} />
          <Route path="/result" element={<Result />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        
        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/questions" element={<QuestionList />} />
          <Route path="/admin/test-responses" element={<TestResponsesList />} />
          <Route path="/admin/test-response/:responseId" element={<TestResponseView />} />
          <Route path="/admin/add-question" element={<AddQuestion />} />
          <Route path="/admin/edit-question/:questionId" element={<EditQuestion />} />
          <Route path="/admin/feedbacks" element={<FeedbacksList />} />
          <Route path="/admin/special-tests" element={<SpecialTestsList />} />
          <Route path="/admin/create-special-test" element={<CreateSpecialTest />} />
          <Route path="/admin/special-test/:testId/add-questions" element={<SpecialTestAddQuestions />} />
        </Route>
        
        {/* 404 Route - matches any route that wasn't defined */}
        <Route path="*" element={
          <motion.div
            className="page"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <div>
              <h2>404 Not Found</h2>
              <p>Sorry, the page you are looking for does not exist.</p>
            </div>
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="h-screen">
      <AnimatedRoutes>
      </AnimatedRoutes>
      
      <ThemeProvider
        defaultTheme="light"
        storageKey="vite-react-theme"
      >
      </ThemeProvider>
      <Toaster />
    </div>
  );
};

export default App;

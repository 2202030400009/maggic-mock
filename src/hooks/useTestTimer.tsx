
import { useEffect, useRef } from "react";

export interface UseTestTimerProps {
  loading: boolean;
  remainingTime: number;
  setRemainingTime: React.Dispatch<React.SetStateAction<number>>;
  currentQuestion: number;
  timeSpent: number[];
  setTimeSpent: React.Dispatch<React.SetStateAction<number[]>>;
  handleSubmitTest: () => void;
}

export const useTestTimer = ({
  loading,
  remainingTime,
  setRemainingTime,
  currentQuestion,
  timeSpent,
  setTimeSpent,
  handleSubmitTest
}: UseTestTimerProps) => {
  // References for accurate timing
  const lastTickRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0);
  
  // Main timer for test duration - Using Date.now() for accurate timing
  useEffect(() => {
    if (loading) return;
    
    // Initialize the reference time when the effect first runs
    lastTickRef.current = Date.now();
    
    const timerInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastTickRef.current) / 1000); // Convert to seconds
      
      // Update the last tick time
      lastTickRef.current = now;
      
      // Only decrement if there's actual time elapsed (handles tab focus/background)
      if (elapsed > 0) {
        setRemainingTime(prev => {
          const newTime = Math.max(0, prev - elapsed);
          
          if (newTime <= 0) {
            clearInterval(timerInterval);
            handleSubmitTest();
            return 0;
          }
          
          return newTime;
        });
      }
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [loading, setRemainingTime, handleSubmitTest]);
  
  // Question-specific timer using Date.now() for accuracy
  useEffect(() => {
    if (loading) return;
    
    // Set the start time for this question
    questionStartTimeRef.current = Date.now();
    
    const questionInterval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - questionStartTimeRef.current) / 1000);
      
      if (elapsedSeconds > 0) {
        questionStartTimeRef.current = now; // Reset the timer
        
        setTimeSpent(prev => {
          const updated = [...prev];
          updated[currentQuestion] = (updated[currentQuestion] || 0) + 1;
          return updated;
        });
      }
    }, 1000);
    
    return () => {
      clearInterval(questionInterval);
    };
  }, [currentQuestion, loading, setTimeSpent]);

  // We don't need to return anything as we're using the state directly
  return null;
};

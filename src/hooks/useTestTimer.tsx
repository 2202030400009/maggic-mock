
import { useEffect } from "react";

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
  // Main timer for test duration
  useEffect(() => {
    if (loading) return;
    
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loading, setRemainingTime, handleSubmitTest]);
  
  // Question-specific timer
  useEffect(() => {
    if (loading) return;
    
    let questionTimer: NodeJS.Timeout;
    
    const startTimer = () => {
      questionTimer = setInterval(() => {
        setTimeSpent(prev => {
          const updated = [...prev];
          updated[currentQuestion] = (updated[currentQuestion] || 0) + 1;
          return updated;
        });
      }, 1000);
    };
    
    startTimer();
    
    return () => {
      if (questionTimer) clearInterval(questionTimer);
    };
  }, [currentQuestion, loading, setTimeSpent]);

  // We don't need to return anything as we're using the state directly
  return null;
};

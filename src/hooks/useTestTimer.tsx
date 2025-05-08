import { useEffect, useRef } from "react";

export interface UseTestTimerProps {
  loading: boolean;
  remainingTime: number; // Time allocated for the test
  setRemainingTime: React.Dispatch<React.SetStateAction<number>>; // Setter to update the remaining time
  currentQuestion: number;
  timeSpent: number[]; // Time spent on each question
  setTimeSpent: React.Dispatch<React.SetStateAction<number[]>>;
  handleSubmitTest: () => void; // Function to submit the test when time is up
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
  // Use refs to avoid re-renders and to persist between renders
  const startTimeRef = useRef<number | null>(null);
  const mainTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDurationRef = useRef<number>(remainingTime);

  // Main timer for test duration (remaining time)
  useEffect(() => {
    // Don't run if loading or no time left
    if (loading) return;
    
    // Initialize start time if not already set
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      initialDurationRef.current = remainingTime;
    }

    // Clear any existing timer to prevent duplicates
    if (mainTimerRef.current) {
      clearInterval(mainTimerRef.current);
    }

    // Only start timer if there's time remaining
    if (remainingTime > 0) {
      // Create a new timer that updates every second
      mainTimerRef.current = setInterval(() => {
        // Calculate the elapsed time since test started
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current!) / 1000);
        // Calculate new remaining time
        const newRemainingTime = Math.max(0, initialDurationRef.current - elapsedSeconds);
        
        // Update the remaining time
        setRemainingTime(newRemainingTime);
        
        // Check if time is up
        if (newRemainingTime <= 0) {
          if (mainTimerRef.current) {
            clearInterval(mainTimerRef.current);
          }
          handleSubmitTest();
        }
      }, 1000);
    } else if (remainingTime <= 0) {
      // If time is already up, submit the test
      handleSubmitTest();
    }

    // Cleanup function
    return () => {
      if (mainTimerRef.current) {
        clearInterval(mainTimerRef.current);
      }
    };
  }, [loading, handleSubmitTest]);

  // Question-specific timer (time spent on the current question)
  useEffect(() => {
    if (loading || remainingTime <= 0) return;
    
    // Clear previous question timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    
    // Start a new timer for the current question
    questionTimerRef.current = setInterval(() => {
      setTimeSpent(prev => {
        const updated = [...prev];
        updated[currentQuestion] = (updated[currentQuestion] || 0) + 1;
        return updated;
      });
    }, 1000);
    
    // Cleanup function
    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    };
  }, [currentQuestion, loading, remainingTime, setTimeSpent]);
  
  return null;
};

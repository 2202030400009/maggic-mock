
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const useFullscreenMonitor = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        const confirmExit = window.confirm("Are you sure you want to exit the test?");
        if (confirmExit) {
          navigate("/dashboard");
        } else {
          try {
            document.documentElement.requestFullscreen();
          } catch (error) {
            console.error("Fullscreen request failed:", error);
          }
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [navigate]);

  return null;
};

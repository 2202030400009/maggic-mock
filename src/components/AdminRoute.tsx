
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !isAdmin) {
      navigate("/dashboard");
    }
  }, [currentUser, isAdmin, navigate]);

  return currentUser && isAdmin ? <>{children}</> : null;
};

export default AdminRoute;

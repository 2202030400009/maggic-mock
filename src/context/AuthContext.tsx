
import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is admin
  const checkAdminStatus = async (user: User) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "admins", user.uid));
        setIsAdmin(userDoc.exists());
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await checkAdminStatus(user);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await checkAdminStatus(result.user);
      navigate("/paper-selection");
    } catch (error) {
      toast({
        title: "Error",
        description: "Wrong credentials, please contact Developer Rajat.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    currentUser,
    isAdmin,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


import { Question } from "@/lib/types";
import { collection, DocumentData, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Function to fetch questions from Firestore
export const fetchQuestions = async (
  type: string,
  paperType: string,
  params: Record<string, any>
): Promise<Question[]> => {
  try {
    let q;
    
    if (type === "Full Syllabus") {
      q = query(
        collection(db, "questions"),
        where("paperType", "==", paperType)
      );
    } else if (type === "Subject Wise") {
      q = query(
        collection(db, "questions"),
        where("paperType", "==", paperType),
        where("subject", "==", params.subject)
      );
    } else if (type === "Multi-Subject Test") {
      q = query(
        collection(db, "questions"),
        where("paperType", "==", paperType),
        where("subject", "in", params.subjects)
      );
    } else {
      return [];
    }
    
    const querySnapshot = await getDocs(q);
    const questions: Question[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as DocumentData;
      questions.push({ 
        id: doc.id, 
        text: data.text as string,
        type: data.type as "MCQ" | "MSQ" | "NAT",
        options: data.options as { id: string; text: string }[],
        correctOption: data.correctOption as string | undefined,
        correctOptions: data.correctOptions as string[] | undefined,
        rangeStart: data.rangeStart as number | undefined,
        rangeEnd: data.rangeEnd as number | undefined,
        imageUrl: data.imageUrl as string | undefined,
        marks: data.marks as number,
        negativeMark: data.negativeMark as number,
        subject: data.subject as string
      });
    });
    
    return questions;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

// Function to shuffle an array
export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

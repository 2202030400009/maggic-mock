
import { useParams } from "react-router-dom";
import TestContainer from "@/components/test/TestContainer";

const Test = () => {
  const { testId } = useParams();
  
  // testId will be defined if we're on a route like /test/special/:testId
  return <TestContainer />;
};

export default Test;

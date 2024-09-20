import { Button } from "@/components/ui/button";
import { AppDispatch } from "@/store/store";
import FetchApiWrapper from "@/utils/FetchApiWrapper";
import { useState } from "react";
import { useDispatch } from "react-redux";

const Settings = () => {
  const dispatch: AppDispatch = useDispatch();
  const [result, setResult] = useState<object | null>(null);
  const handleGetCurrenUser = async () => {
    try {
      const data = await FetchApiWrapper(
        "http://localhost:3000/api/auth/check-me",
        { credentials: "include" },
        dispatch
      );
      console.log("data in settings", data);
      setResult(data);
    } catch (error) {
      console.log("error", error);
    }
  };
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-5">
      <Button size={"lg"} onClick={handleGetCurrenUser}>
        Demo
      </Button>
      <p>{result ? result.toString() : "result is null"}</p>
    </div>
  );
};

export default Settings;

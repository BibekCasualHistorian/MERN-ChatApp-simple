import React, { useState } from "react";

import EachInput from "@/components/auth/EachInput";
import AuthCard from "@/components/auth/AuthCard";
import { AppDispatch, loginStart, loginSuccess } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // get data from redux toolkit
  const { isLoading } = useSelector((state: any) => state.user);
  const dispatch: AppDispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    dispatch(loginStart());

    // Frontend validation
    if (!code) {
      setError("Verification code is required");
      return;
    }
    if (code.length !== 6) {
      setError("Verification code must be 6 digits long");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("Verification code must be numeric");
      return;
    }

    setError(null);

    try {
      const url = `http://localhost:3000/api/auth/verify-email/${code}`;
      console.log("url", url);
      const response = await fetch(url, { credentials: "include" });

      const data = await response.json();

      console.log("email verification", data);

      if (!data.success) {
        setError(data.message || "Verification failed");
      } else {
        setSuccess("Email verified successfully!");

        if (data.data) {
          localStorage.setItem("user", data.data);
          dispatch(loginSuccess(data.data)); // Update with correct action and payload
        }

        navigate("/");
      }
    } catch (error) {
      setError(
        (error as Error).message || "An error occurred during verification"
      );
    }
  };

  return (
    <div className="min-h-screen">
      <AuthCard
        isLoading={isLoading}
        buttonText="Verify"
        error={error}
        success={success}
        title="Verify Your Email"
        description="Enter the 6-digit code sent to your email"
        footerLinkText="Need a new code? Request again"
        footerLinkTo="/auth/request-code"
        onClick={(e) =>
          handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
        }
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <EachInput
            type="string"
            label="Verification Code"
            state={code}
            setState={setCode}
            placeholder="Enter the 6-digit code..."
          />
        </form>
      </AuthCard>
    </div>
  );
};

export default VerifyEmail;

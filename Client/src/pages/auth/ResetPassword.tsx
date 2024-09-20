import React, { useState } from "react";

import { Input } from "@/components/ui/input";
import AuthCard from "@/components/auth/AuthCard";
import { useNavigate, useParams } from "react-router-dom";

const ResetPassword = () => {
  const { token } = useParams();

  const navigate = useNavigate();

  console.log("token", token);

  const [isLoading, setIsLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    setSuccess(null);
    setError(null);
    // Validation
    if (!newPassword) {
      setError("New password is required");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3000/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newPassword,
            confirmPassword,
          }),
          credentials: "include",
        }
      );

      const data = await response.json();

      console.log("data: " + data);

      setIsLoading(false);

      if (!data.success) {
        setError(data.message || "Password reset failed");
      } else {
        // Clear fields after success
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("Password successfully reset!");
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    } catch (error) {
      setError(
        (error as Error).message ||
          "An error occurred during the password reset"
      );
    }
  };

  return (
    <div className="min-h-screen">
      <AuthCard
        isLoading={isLoading}
        onClick={(e) =>
          handleResetPassword(e as unknown as React.FormEvent<HTMLFormElement>)
        }
        error={error}
        success={success}
        title="Reset Password"
        description="Enter a new password and confirm it to reset"
        footerLinkText="Remember your password? Login"
        footerLinkTo="/auth/login"
        buttonText="Reset Password" // Custom button text
      >
        <form onSubmit={handleResetPassword} className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="font-semibold">
              New Password:
            </label>
            <Input
              autoComplete="off"
              type="password"
              required
              className="w-full"
              value={newPassword}
              placeholder="Enter your new password..."
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-password" className="font-semibold">
              Confirm New Password:
            </label>
            <Input
              autoComplete="off"
              type="password"
              required
              className="w-full"
              value={confirmPassword}
              placeholder="Confirm your new password..."
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </form>
      </AuthCard>
    </div>
  );
};

export default ResetPassword;

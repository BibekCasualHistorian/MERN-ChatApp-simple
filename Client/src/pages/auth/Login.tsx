import React, { useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import EachInput from "@/components/auth/EachInput";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "@/store/store";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);

    // Frontend validation
    if (!email) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setError(null);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
        credentials: "include",
      });

      const data = await response.json();

      // console.log("data in login", data);

      setIsLoading(false);

      if (
        !data.success &&
        data.message == "You are not verified. Register again"
      ) {
        setError("You are not verified. Register your account");
        setTimeout(() => {
          navigate("/auth/register");
        }, 2000);
      }

      if (!data.success) {
        setError(data.message || "Login failed");
      } else {
        setSuccess("Login successful!");
        dispatch(loginSuccess(data.data));
        navigate("/");
      }
    } catch (error) {
      setError((error as Error).message || "An error occurred during login");
    }
  };

  return (
    <div className="min-h-screen">
      <AuthCard
        isLoading={isLoading}
        error={error}
        success={success}
        title="Login"
        buttonText="Login"
        description="Access your account"
        footerLinkText="Don't have an account? Register"
        footerLinkTo="/auth/register"
        onClick={(e) =>
          handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
        }
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <EachInput
            type="email"
            label="Email"
            state={email}
            setState={setEmail}
            placeholder="Enter your email..."
          />
          <EachInput
            type="password"
            label="Password"
            state={password}
            setState={setPassword}
            placeholder="Enter your password..."
          />
          <div className="flex justify-end text-sm">
            <Link to={"/auth/forgot-password"} className="text-blue-600">
              forgot password?
            </Link>
          </div>
        </form>
      </AuthCard>
    </div>
  );
};

export default Login;

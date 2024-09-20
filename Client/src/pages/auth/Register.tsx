import React, { useRef, useState } from "react";

import AuthCard from "@/components/auth/AuthCard";
import EachInput from "@/components/auth/EachInput";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const naviagte = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>("");
  const [success, setSuccess] = useState<string | null>("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    "https://via.placeholder.com/150"
  );
  console.log("photo", photo);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // dispatch(loginStart());

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!username) {
      setError("Username is required");
      return;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }
    if (username.length > 40) {
      setError("Username cannot be longer than 40 characters");
      return;
    }

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

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username, password }),
        credentials: "include",
      });

      const data = await response.json();

      console.log("data", data);

      if (!data.success) {
        setError(data.message || "Registration failed");
        setIsLoading(false);
      } else {
        setSuccess(data.message);
        // if (data.data) {
        //   dispatch(loginSuccess(data.data)); // Update with correct action and payload
        // }

        setTimeout(() => {
          naviagte("/auth/verify-email");
        }, 4000);
      }
    } catch (error) {
      setError(
        (error as Error).message || "An error occurred during registration"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AuthCard
        isLoading={isLoading}
        error={error}
        success={success}
        title="Register"
        description="Create a new account"
        footerLinkText="Already Logged in? Login"
        footerLinkTo="/auth/login"
        onClick={(e) =>
          handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
        }
        buttonText="Register"
      >
        <form className="space-y-3">
          <div className="flex flex-col items-center">
            <div
              onClick={handlePhotoClick}
              className="w-32 h-32 flex items-center justify-center cursor-pointer rounded"
            >
              <img
                src={photoPreview || ""}
                alt="Preview"
                className="w-full h-full bg-inherit object-cover rounded-full"
              />
            </div>
            <label className="mt-2 font-semibold">Select Photo :</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          <EachInput
            type="string"
            label="Username"
            state={username}
            setState={setUsername}
            placeholder="Enter your username..."
          />
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
        </form>
      </AuthCard>
    </div>
  );
};

export default Register;

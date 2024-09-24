import React from "react";
import { Link } from "react-router-dom";
import {
  FaGoogle,
  FaGithub,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuthCardProps {
  isLoading: boolean;
  title: string;
  description: string;
  success: string | null;
  includeSocial?: boolean;
  children: React.ReactNode;
  footerLinkText: string;
  footerLinkTo: string;
  error: string | null;
  buttonText?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const AuthCard: React.FC<AuthCardProps> = ({
  isLoading,
  error,
  title,
  buttonText,
  description,
  includeSocial,
  children,
  footerLinkText,
  footerLinkTo,
  success,
  onClick,
}) => {
  return (
    <div className=" min-h-screen grid place-items-center">
      <Card className="bg-gray-100 max-w-[450px] col-span-full mx-auto w-full ">
        <CardHeader className="text-center capitalize">
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="">
          {children}
          <div className="mt-3">
            {error && (
              <p className="text-red-500 p-2  pl-4 bg-red-200 flex items-center gap-3 text-sm bg- rounded-lg">
                <span>
                  <FaExclamationTriangle />
                </span>
                <span>{error}</span>
              </p>
            )}
            {success && (
              <p className="text-green-500  bg-green-200 flex items-center gap-3 text-sm rounded-lg p-2 pl-4">
                <FaCheckCircle />
                <span>{success}</span>
              </p>
            )}
          </div>
          {includeSocial && (
            <div className="w-full my-4 items-stretch flex gap-2">
              <Button size={"default"} className="flex-1   p-2 ">
                <FaGoogle size={20} className="" />
              </Button>
              <Button size={"default"} className="flex-1   p-2">
                <FaGithub size={20} />
              </Button>
            </div>
          )}
          <Button
            disabled={isLoading}
            className="w-full mt-2"
            onClick={onClick}
            onKeyDown={(e) => {
              if (e.key == "Enter") {
                e.preventDefault();
              }
            }}
          >
            {buttonText || "Submit"}
          </Button>
        </CardContent>
        <CardFooter className="text-center w-full">
          <Link
            to={footerLinkTo}
            className="block hover:underline w-full text-gray-500"
          >
            {footerLinkText}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthCard;

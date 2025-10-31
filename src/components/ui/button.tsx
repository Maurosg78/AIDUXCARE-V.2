import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "solid";
}

const Button: React.FC<ButtonProps> = ({ variant = "solid", children, ...props }) => {
  const style =
    variant === "outline"
      ? "border border-gray-400 text-gray-800 bg-white hover:bg-gray-100"
      : "bg-blue-600 text-white hover:bg-blue-700";
  return (
    <button className={`px-4 py-2 rounded-md text-sm font-medium ${style}`} {...props}>
      {children}
    </button>
  );
};

export default Button;

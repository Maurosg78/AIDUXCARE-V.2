import React from "react";
import { cn } from "@/lib/utils";

export type SelectVariant = "default" | "outline" | "filled";
export type SelectSize = "sm" | "md" | "lg";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: SelectVariant;
  size?: SelectSize;
  fullWidth?: boolean;
  options: SelectOption[];
}

const variantStyles: Record<SelectVariant, string> = {
  default:
    "bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500",
  outline:
    "bg-transparent border-2 border-gray-300 focus:border-primary-500 focus:ring-primary-500",
  filled:
    "bg-gray-100 border-transparent focus:bg-white focus:border-primary-500 focus:ring-primary-500",
};

const sizeStyles: Record<SelectSize, string> = {
  sm: "text-sm py-1 px-2",
  md: "text-base py-2 px-3",
  lg: "text-lg py-3 px-4",
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      variant = "default",
      size = "md",
      fullWidth = false,
      options,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "block w-full rounded-md shadow-sm transition-colors duration-200";
    const errorStyles = error
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "";
    const disabledStyles = disabled
      ? "bg-gray-100 cursor-not-allowed opacity-60"
      : "";

    return (
      <div
        className={cn("flex flex-col gap-1", fullWidth ? "w-full" : "w-fit")}
      >
        {label && (
          <label
            htmlFor={props.id}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            baseStyles,
            variantStyles[variant],
            sizeStyles[size],
            errorStyles,
            disabledStyles,
            className,
          )}
          disabled={disabled}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error || helperText ? `${props.id}-description` : undefined
          }
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {(error || helperText) && (
          <p
            id={`${props.id}-description`}
            className={cn("text-sm", error ? "text-red-500" : "text-gray-500")}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

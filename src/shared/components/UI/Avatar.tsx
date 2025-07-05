import React from "react";
import { cn } from "@/lib/utils";

export type AvatarVariant = "default" | "outline" | "filled";
export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AvatarVariant;
  size?: AvatarSize;
  src?: string;
  alt?: string;
  fallback?: string;
}

const variantStyles: Record<AvatarVariant, string> = {
  default: "bg-gray-100",
  outline: "bg-transparent border-2 border-gray-200",
  filled: "bg-primary-100",
};

const sizeStyles: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      variant = "default",
      size = "md",
      src,
      alt,
      fallback,
      className,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "relative flex items-center justify-center rounded-full overflow-hidden";
    const [error, setError] = React.useState(false);

    const handleError = () => {
      setError(true);
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {src && !error ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={handleError}
          />
        ) : (
          <span className="font-medium text-gray-600">
            {fallback?.charAt(0).toUpperCase() || "?"}
          </span>
        )}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";

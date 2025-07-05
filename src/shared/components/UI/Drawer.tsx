import React from "react";
import { cn } from "@/lib/utils";

export type DrawerPosition = "left" | "right" | "top" | "bottom";
export type DrawerSize = "sm" | "md" | "lg" | "xl" | "full";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: DrawerPosition;
  size?: DrawerSize;
  headerTitle?: React.ReactNode;
  headerDescription?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const positionStyles: Record<DrawerPosition, string> = {
  left: "left-0 top-0 h-full",
  right: "right-0 top-0 h-full",
  top: "top-0 left-0 w-full",
  bottom: "bottom-0 left-0 w-full",
};

const sizeStyles: Record<DrawerSize, string> = {
  sm: "w-64",
  md: "w-96",
  lg: "w-[32rem]",
  xl: "w-[40rem]",
  full: "w-full",
};

const slideStyles: Record<DrawerPosition, string> = {
  left: "translate-x-0 -translate-x-full",
  right: "translate-x-0 translate-x-full",
  top: "translate-y-0 -translate-y-full",
  bottom: "translate-y-0 translate-y-full",
};

export const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  (
    {
      isOpen,
      onClose,
      position = "right",
      size = "md",
      headerTitle,
      headerDescription,
      children,
      className,
    },
    ref,
  ) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <div
        ref={ref}
        className="fixed inset-0 z-50 flex"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headerTitle ? "drawer-title" : undefined}
        aria-describedby={headerDescription ? "drawer-description" : undefined}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />

        {/* Drawer */}
        <div
          className={cn(
            "fixed bg-white shadow-xl transition-transform duration-300 ease-in-out",
            positionStyles[position],
            sizeStyles[size],
            isOpen
              ? slideStyles[position].split(" ")[0]
              : slideStyles[position].split(" ")[1],
            className,
          )}
        >
          {/* Header */}
          {(headerTitle || headerDescription) && (
            <div className="px-6 py-4 border-b border-gray-200">
              {headerTitle && (
                <h2
                  id="drawer-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {headerTitle}
                </h2>
              )}
              {headerDescription && (
                <p
                  id="drawer-description"
                  className="mt-1 text-sm text-gray-500"
                >
                  {headerDescription}
                </p>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">{children}</div>

          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            onClick={onClose}
            aria-label="Cerrar drawer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  },
);

Drawer.displayName = "Drawer";

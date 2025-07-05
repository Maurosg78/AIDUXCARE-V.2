import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string;
  onChange?: (id: string, isOpen: boolean) => void;
  variant?: "default" | "bordered";
  size?: "sm" | "md" | "lg";
}

const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpen,
  onChange,
  variant = "default",
  size = "md",
}) => {
  const [openItems, setOpenItems] = useState<Set<string>>(
    defaultOpen ? new Set([defaultOpen]) : new Set(),
  );

  const handleToggle = useCallback(
    (id: string) => {
      setOpenItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        onChange?.(id, newSet.has(id));
        return newSet;
      });
    },
    [onChange],
  );

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "lg":
        return "text-lg";
      default:
        return "text-base";
    }
  };

  const getVariantClasses = (variant: string) => {
    switch (variant) {
      case "bordered":
        return "border border-gray-200 rounded-lg divide-y divide-gray-200";
      default:
        return "";
    }
  };

  return (
    <div className={cn("w-full", getVariantClasses(variant))}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        const isDisabled = item.disabled;

        return (
          <div
            key={item.id}
            className={cn("w-full", { "opacity-50": isDisabled })}
          >
            <button
              className={cn(
                "w-full flex items-center justify-between p-4 text-left",
                getSizeClasses(size),
                { "cursor-not-allowed": isDisabled },
              )}
              onClick={() => !isDisabled && handleToggle(item.id)}
              disabled={isDisabled}
              aria-expanded={isOpen}
              aria-controls={`content-${item.id}`}
            >
              <span>{item.title}</span>
              <span className="ml-2">{isOpen ? "−" : "+"}</span>
            </button>
            <div
              id={`content-${item.id}`}
              className={cn(
                "overflow-hidden transition-all duration-200 ease-in-out",
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
              )}
              aria-hidden={!isOpen}
            >
              <div className="p-4">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;

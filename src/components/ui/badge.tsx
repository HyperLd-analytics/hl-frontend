import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline" | "destructive";
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-md font-medium text-xs px-2 py-0.5 transition-colors";

  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-border text-foreground",
    destructive: "bg-red-500/10 text-red-500",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  );
}

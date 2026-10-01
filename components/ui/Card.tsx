import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

/** Reusable card container with white background and subtle shadow */
export function Card({
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  const paddingClasses = {
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={[
        "bg-white rounded-xl border border-gray-200 shadow-sm",
        paddingClasses[padding],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "mobile";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
      ghost: "hover:bg-gray-100 text-gray-700",
      outline: "border-2 border-current bg-transparent hover:bg-gray-50",
    };

    const sizes = {
      default: "h-10 py-2 px-4",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-8 text-base",
      mobile: "h-12 py-3 px-6 text-base min-h-[44px]", // Apple's recommended minimum touch target
    };

    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button
        className={classes}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };

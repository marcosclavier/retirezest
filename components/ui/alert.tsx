import * as React from "react"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-white text-gray-900 border-gray-200",
      destructive: "bg-red-50 text-red-900 border-red-200",
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={`relative w-full rounded-lg border p-4 ${variants[variant]} ${className}`}
        {...props}
      />
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = "", ...props }, ref) => (
  <h5
    ref={ref}
    className={`mb-1 font-medium leading-none tracking-tight ${className}`}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm opacity-90 ${className}`}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

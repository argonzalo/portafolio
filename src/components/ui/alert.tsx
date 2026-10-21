import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative flex w-full gap-3 rounded-2xl border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        warning:
          "border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        info: "border-primary/20 bg-primary/8 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="status"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-title"
      className={cn("font-medium tracking-tight", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm leading-relaxed opacity-90", className)}
      {...props}
    />
  )
}

export { Alert, AlertDescription, AlertTitle }

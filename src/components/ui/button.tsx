import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-250 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-muted/40 disabled:text-muted-foreground/80 dark:disabled:text-muted-foreground/60 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/95 hover:-translate-y-[2px] active:translate-y-0 hover:shadow-md active:shadow-sm hover:brightness-105",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/95 hover:-translate-y-[2px] active:translate-y-0 hover:shadow-md active:shadow-sm hover:brightness-105",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:-translate-y-[2px] active:translate-y-0 hover:shadow-md active:shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:-translate-y-[2px] active:translate-y-0 hover:shadow-md active:shadow-sm hover:brightness-105",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:-translate-y-[2px] active:translate-y-0 hover:shadow-sm active:shadow-none",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

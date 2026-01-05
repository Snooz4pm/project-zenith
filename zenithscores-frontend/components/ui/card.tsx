import * as React from "react"
import { cn } from "@/lib/utils"

export const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur",
            className
        )}
        {...props}
    />
))

Card.displayName = "Card"

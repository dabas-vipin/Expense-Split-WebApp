import * as React from "react"
import { cn } from "@/lib/utils"

const AvatarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex -space-x-2", className)} {...props} />,
)
AvatarGroup.displayName = "AvatarGroup"

export { AvatarGroup }


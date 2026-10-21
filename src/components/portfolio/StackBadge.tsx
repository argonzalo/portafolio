import { Badge } from "@/components/ui/badge"
import { stackIconClass } from "@/lib/stack"
import { cn } from "@/lib/utils"

type StackBadgeProps = {
  name: string
  className?: string
}

export function StackBadge({ name, className }: StackBadgeProps) {
  return (
    <Badge variant="muted" className={cn("gap-1 pr-2.5 pl-1.5", className)}>
      <span
        className={cn(stackIconClass(name), "size-3.5 shrink-0 bg-contain")}
        aria-hidden="true"
      />
      {name}
    </Badge>
  )
}

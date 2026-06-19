import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type TableShellProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  headerAction?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function TableShell({
  title,
  description,
  headerAction,
  children,
  className,
  contentClassName,
}: TableShellProps) {
  const hasHeader = title || description || headerAction

  return (
    <Card className={cn("border-border bg-card", className)}>
      {hasHeader ? (
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-4">
          {(title || description) && (
            <div className="space-y-1">
              {title ? (
                typeof title === "string" ? (
                  <CardTitle className="text-lg">{title}</CardTitle>
                ) : (
                  title
                )
              ) : null}
              {description ? (
                typeof description === "string" ? (
                  <CardDescription>{description}</CardDescription>
                ) : (
                  description
                )
              ) : null}
            </div>
          )}
          {headerAction}
        </CardHeader>
      ) : null}
      <CardContent className={cn("p-0", contentClassName)}>{children}</CardContent>
    </Card>
  )
}

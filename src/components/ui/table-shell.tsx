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
  variant?: "default" | "dashboard"
}

export function TableShell({
  title,
  description,
  headerAction,
  children,
  className,
  contentClassName,
  variant = "default",
}: TableShellProps) {
  const hasHeader = title || description || headerAction

  return (
    <Card
      className={cn(
        variant === "dashboard"
          ? "border-[#303030] bg-[#121212] text-white shadow-none"
          : "border-border bg-card",
        className,
      )}
    >
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

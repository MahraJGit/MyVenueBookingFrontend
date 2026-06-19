import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type TableSkeletonProps = {
  rows?: number
  cols: number
  className?: string
}

export function TableSkeleton({ rows = 5, cols, className }: TableSkeletonProps) {
  return Array.from({ length: rows }).map((_, i) => (
    <TableRow key={`sk-${i}`} className={cn("border-border", className)}>
      {Array.from({ length: cols }).map((__, j) => (
        <TableCell key={j} className="py-3">
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

type TableEmptyRowProps = {
  colSpan: number
  children: React.ReactNode
  className?: string
}

export function TableEmptyRow({ colSpan, children, className }: TableEmptyRowProps) {
  return (
    <TableRow className="border-border">
      <TableCell
        colSpan={colSpan}
        className={cn("py-16 text-center text-muted-foreground", className)}
      >
        {children}
      </TableCell>
    </TableRow>
  )
}

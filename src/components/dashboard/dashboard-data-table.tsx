'use client'

import type { ReactNode } from 'react'
import {
  DashboardPagination,
  DashboardTableWrapper,
} from '@/components/dashboard/dashboard-ui'

type DashboardDataTableProps = {
  children: ReactNode
  className?: string
  pagination?: {
    label: ReactNode
    page: number
    totalPages: number
    total: number
    onPageChange: (page: number) => void
    previousLabel: string
    nextLabel: string
    isLoading?: boolean
  }
}

/**
 * Standard admin table shell: full-width wrapper + shadcn pagination.
 * Always pair with `Table` using `dashboardTableClass` and `dashboardTableContainerClass`.
 */
export function DashboardDataTable({
  children,
  className,
  pagination,
}: DashboardDataTableProps) {
  return (
    <div className="w-full min-w-0 space-y-4">
      <DashboardTableWrapper className={className}>{children}</DashboardTableWrapper>

      {pagination && pagination.total > 0 ? (
        <DashboardPagination
          label={pagination.label}
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          previousLabel={pagination.previousLabel}
          nextLabel={pagination.nextLabel}
          isLoading={pagination.isLoading}
        />
      ) : null}
    </div>
  )
}

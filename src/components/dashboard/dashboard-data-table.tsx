'use client'

import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableHead } from '@/components/ui/table'
import {
  DashboardFilterBar,
  DashboardPagination,
  DashboardSearchInput,
  DashboardTableWrapper,
  dashboardDropdownContentClass,
  dashboardOutlineButtonClass,
  dashboardSelectTriggerClass,
} from '@/components/dashboard/dashboard-ui'
import {
  TABLE_PAGE_SIZE_OPTIONS,
  type TablePageSize,
  type TableSortOrder,
} from '@/hooks/use-table-query-state'
import { cn } from '@/lib/utils'

type DashboardDataTablePagination = {
  label: ReactNode
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  previousLabel: string
  nextLabel: string
  isLoading?: boolean
}

type DashboardDataTableToolbar = {
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder: string
  }
  filters?: ReactNode
  pageSize?: {
    value: TablePageSize
    onChange: (value: TablePageSize) => void
    options?: readonly TablePageSize[]
  }
  onReset?: () => void
  showReset?: boolean
  isRefreshing?: boolean
  trailing?: ReactNode
}

type DashboardDataTableProps = {
  children: ReactNode
  className?: string
  toolbar?: DashboardDataTableToolbar
  pagination?: DashboardDataTablePagination
}

/**
 * Standard admin table shell: toolbar (search/filters/page size) +
 * full-width wrapper + shadcn pagination.
 */
export function DashboardDataTable({
  children,
  className,
  toolbar,
  pagination,
}: DashboardDataTableProps) {
  const t = useTranslations('tables')
  const tListing = useTranslations('listing')
  const tCommon = useTranslations('common')

  const pageSizeOptions = toolbar?.pageSize?.options ?? TABLE_PAGE_SIZE_OPTIONS
  const showReset = Boolean(toolbar?.showReset && toolbar.onReset)

  return (
    <div className="w-full min-w-0 space-y-4">
      {toolbar ? (
        <DashboardFilterBar
          action={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {toolbar.filters}
              {toolbar.pageSize ? (
                <div className="flex items-center gap-2">
                  <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:inline">
                    {t('rowsPerPage')}
                  </span>
                  <Select
                    value={String(toolbar.pageSize.value)}
                    onValueChange={(value) =>
                      toolbar.pageSize?.onChange(Number(value) as TablePageSize)
                    }
                  >
                    <SelectTrigger
                      className={cn('h-9 w-[88px]', dashboardSelectTriggerClass)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={dashboardDropdownContentClass}>
                      {pageSizeOptions.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {showReset ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn('h-9', dashboardOutlineButtonClass)}
                  onClick={toolbar.onReset}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  {tListing('clearFilters')}
                </Button>
              ) : null}
              {toolbar.isRefreshing ? (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {tCommon('refreshing')}
                </span>
              ) : null}
              {toolbar.trailing}
            </div>
          }
        >
          {toolbar.search ? (
            <div className="w-full max-w-sm">
              <DashboardSearchInput
                placeholder={toolbar.search.placeholder}
                value={toolbar.search.value}
                onChange={(e) => toolbar.search?.onChange(e.target.value)}
              />
            </div>
          ) : null}
        </DashboardFilterBar>
      ) : null}

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

type DashboardSortableHeaderProps = {
  label: ReactNode
  column: string
  sortBy?: string
  sortOrder?: TableSortOrder
  onSort: (column: string) => void
  className?: string
}

export function DashboardSortableHeader({
  label,
  column,
  sortBy,
  sortOrder,
  onSort,
  className,
}: DashboardSortableHeaderProps) {
  const t = useTranslations('tables')
  const active = sortBy === column
  const Icon = !active ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown

  return (
    <TableHead className={cn('whitespace-nowrap text-muted-foreground', className)}>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 hover:text-white"
        onClick={() => onSort(column)}
        aria-label={
          active
            ? sortOrder === 'asc'
              ? t('sortDesc')
              : t('sortAsc')
            : t('sortAsc')
        }
      >
        {label}
        <Icon className="h-3.5 w-3.5 opacity-70" aria-hidden />
      </button>
    </TableHead>
  )
}

export function formatTableRangeLabel(params: {
  page: number
  pageSize: number
  total: number
  showingLabel: (args: { from: number; to: number; total: number }) => string
}) {
  const { page, pageSize, total, showingLabel } = params
  if (total <= 0) return showingLabel({ from: 0, to: 0, total: 0 })
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return showingLabel({ from, to, total })
}

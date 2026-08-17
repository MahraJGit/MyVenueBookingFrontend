'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TablePageSize } from '@/hooks/use-table-query-state'

const DEFAULT_PAGE_SIZE: TablePageSize = 10

/** Client-side pagination for list endpoints that return all rows at once. */
export function useClientPagination<T>(
  items: T[],
  pageSize: number = DEFAULT_PAGE_SIZE,
  controlled?: {
    page: number
    setPage: (page: number) => void
  },
) {
  const [internalPage, setInternalPage] = useState(1)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const page = controlled?.page ?? internalPage
  const setPage = controlled?.setPage ?? setInternalPage

  useEffect(() => {
    const clampedPage = Math.min(Math.max(1, page), totalPages)
    if (clampedPage !== page) setPage(clampedPage)
  }, [page, setPage, totalPages])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const resetPage = useCallback(() => setPage(1), [setPage])

  const setPageSizeAndReset = useCallback((size: number) => {
    void size
    setPage(1)
  }, [setPage])

  return {
    page,
    setPage,
    resetPage,
    setPageSizeAndReset,
    total,
    totalPages,
    pageSize,
    paginatedItems,
  }
}

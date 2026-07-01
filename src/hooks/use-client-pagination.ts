'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

const DEFAULT_PAGE_SIZE = 10

/** Client-side pagination for list endpoints that return all rows at once. */
export function useClientPagination<T>(
  items: T[],
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const [page, setPage] = useState(1)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const resetPage = useCallback(() => setPage(1), [])

  return {
    page,
    setPage,
    resetPage,
    total,
    totalPages,
    pageSize,
    paginatedItems,
  }
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

export const TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50] as const
export type TablePageSize = (typeof TABLE_PAGE_SIZE_OPTIONS)[number]
export type TableSortOrder = 'asc' | 'desc'

type UseTableQueryStateOptions<TFilters extends Record<string, string>> = {
  initialSearch?: string
  initialPageSize?: TablePageSize
  initialSortBy?: string
  initialSortOrder?: TableSortOrder
  initialFilters?: TFilters
  debounceMs?: number
  /** When true, read/write search, page, pageSize, and filter keys to the URL. */
  syncWithUrl?: boolean
}

function readPageSize(value: string | null, fallback: TablePageSize): TablePageSize {
  const parsed = Number(value)
  return TABLE_PAGE_SIZE_OPTIONS.includes(parsed as TablePageSize)
    ? (parsed as TablePageSize)
    : fallback
}

/**
 * Shared list-query state for admin data tables:
 * debounced search, page, page size, sort, and filters.
 * Changing search/filters/sort/pageSize resets to page 1 without useEffect.
 */
export function useTableQueryState<
  TFilters extends Record<string, string> = Record<string, never>,
>(options: UseTableQueryStateOptions<TFilters> = {}) {
  const {
    initialSearch = '',
    initialPageSize = 10,
    initialSortBy,
    initialSortOrder = 'desc',
    initialFilters,
    debounceMs = 300,
    syncWithUrl = false,
  } = options

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const defaultFilters = useMemo(
    () => (initialFilters ?? {}) as TFilters,
    // Intentionally capture initial filter defaults once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const urlSearch = syncWithUrl ? searchParams.get('search') ?? initialSearch : initialSearch
  const urlPage = syncWithUrl
    ? Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
    : 1
  const urlPageSize = syncWithUrl
    ? readPageSize(searchParams.get('pageSize'), initialPageSize)
    : initialPageSize

  const urlFilters = useMemo(() => {
    if (!syncWithUrl) return defaultFilters
    const next = { ...defaultFilters }
    for (const key of Object.keys(defaultFilters) as Array<keyof TFilters>) {
      const value = searchParams.get(String(key))
      if (value !== null) {
        next[key] = value as TFilters[keyof TFilters]
      }
    }
    const vendorId = searchParams.get('vendorId')
    if (vendorId) {
      ;(next as Record<string, string>).vendorId = vendorId
    }
    return next
  }, [defaultFilters, searchParams, syncWithUrl])

  const [search, setSearchState] = useState(urlSearch)
  const [page, setPage] = useState(urlPage)
  const [pageSize, setPageSizeState] = useState<TablePageSize>(urlPageSize)
  const [sortBy, setSortByState] = useState<string | undefined>(initialSortBy)
  const [sortOrder, setSortOrderState] =
    useState<TableSortOrder>(initialSortOrder)
  const [filters, setFiltersState] = useState<TFilters>(() => urlFilters)

  useEffect(() => {
    if (!syncWithUrl) return
    setSearchState(urlSearch)
    setPage(urlPage)
    setPageSizeState(urlPageSize)
    setFiltersState(urlFilters)
  }, [syncWithUrl, urlFilters, urlPage, urlPageSize, urlSearch])

  const debouncedSearch = useDebouncedValue(search, debounceMs)
  const trimmedSearch = debouncedSearch.trim()

  const setSearch = useCallback((value: string) => {
    setSearchState(value)
    setPage(1)
  }, [])

  const setPageSize = useCallback((size: TablePageSize) => {
    setPageSizeState(size)
    setPage(1)
  }, [])

  const setFilter = useCallback(
    <K extends keyof TFilters>(key: K, value: TFilters[K]) => {
      setFiltersState((prev) => ({ ...prev, [key]: value }))
      setPage(1)
    },
    [],
  )

  const setFilters = useCallback((next: TFilters) => {
    setFiltersState(next)
    setPage(1)
  }, [])

  const setSort = useCallback((column: string, order?: TableSortOrder) => {
    setSortByState((current) => {
      if (order) {
        setSortOrderState(order)
        return column
      }
      if (current === column) {
        setSortOrderState((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        return column
      }
      setSortOrderState('asc')
      return column
    })
    setPage(1)
  }, [])

  const toggleSort = useCallback(
    (column: string) => {
      setSort(column)
    },
    [setSort],
  )

  const reset = useCallback(() => {
    setSearchState(initialSearch)
    setPage(1)
    setPageSizeState(initialPageSize)
    setSortByState(initialSortBy)
    setSortOrderState(initialSortOrder)
    setFiltersState(defaultFilters)
  }, [defaultFilters, initialPageSize, initialSearch, initialSortBy, initialSortOrder])

  const hasActiveFilters = useMemo(() => {
    if (search.trim()) return true
    if (pageSize !== initialPageSize) return true
    if ((sortBy ?? '') !== (initialSortBy ?? '')) return true
    if (sortOrder !== initialSortOrder && sortBy) return true
    for (const key of Object.keys(defaultFilters) as Array<keyof TFilters>) {
      if (filters[key] !== defaultFilters[key]) return true
    }
    const vendorFilter = (filters as Record<string, string>).vendorId
    const defaultVendor = (defaultFilters as Record<string, string>).vendorId
    if (vendorFilter && vendorFilter !== defaultVendor) return true
    return false
  }, [
    defaultFilters,
    filters,
    initialPageSize,
    initialSortBy,
    initialSortOrder,
    pageSize,
    search,
    sortBy,
    sortOrder,
  ])

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(trimmedSearch ? { search: trimmedSearch } : {}),
      ...(sortBy ? { sortBy, sortOrder } : {}),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => value !== undefined && value !== '' && value !== 'ALL',
        ),
      ),
    }),
    [filters, page, pageSize, sortBy, sortOrder, trimmedSearch],
  )

  useEffect(() => {
    if (!syncWithUrl) return

    const params = new URLSearchParams()
    if (trimmedSearch) params.set('search', trimmedSearch)
    if (page > 1) params.set('page', String(page))
    if (pageSize !== initialPageSize) params.set('pageSize', String(pageSize))

    for (const [key, value] of Object.entries(filters)) {
      if (value && value !== 'ALL') {
        params.set(key, value)
      }
    }

    const next = params.toString()
    const current = searchParams.toString()
    if (next === current) return

    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [
    filters,
    initialPageSize,
    page,
    pageSize,
    pathname,
    router,
    searchParams,
    syncWithUrl,
    trimmedSearch,
  ])

  return {
    search,
    setSearch,
    debouncedSearch: trimmedSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortBy,
    sortOrder,
    setSort,
    toggleSort,
    filters,
    setFilter,
    setFilters,
    reset,
    hasActiveFilters,
    queryParams,
    pageSizeOptions: TABLE_PAGE_SIZE_OPTIONS,
  }
}

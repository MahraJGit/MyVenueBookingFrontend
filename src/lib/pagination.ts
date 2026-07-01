export type PaginationItem = number | "ellipsis"

/** Build a compact page list with ellipsis for large page counts. */
export function getPaginationRange(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 1) return [1]
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: PaginationItem[] = [1]

  if (currentPage > 3) {
    pages.push("ellipsis")
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let i = start; i <= end; i += 1) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis")
  }

  pages.push(totalPages)
  return pages
}

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

export default function PaginatedGrid({
  items,
  children,
  initialPageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5",
}) {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [pageState, setPageState] = useState({ items, page: 1 });
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(
    pageState.items === items ? pageState.page : 1,
    pageCount
  );
  const availablePageSizes = [...new Set([initialPageSize, ...pageSizeOptions])]
    .sort((a, b) => a - b);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleItems = items.slice(startIndex, startIndex + pageSize);

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setPageState({ items, page: 1 });
  };

  return (
    <div className="min-w-0">
      <div className={className}>
        {visibleItems.map(children)}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-surface-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center">
          <span className="sr-only">Cards per page</span>
          <select
            aria-label="Cards per page"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="min-w-[112px] rounded-lg border border-surface-border bg-white px-3 py-2 text-xs font-medium text-brand-black/70 outline-none transition-colors focus:border-brand-black"
          >
            {availablePageSizes.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </label>

        {pageCount > 1 && (
          <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center gap-1 self-start sm:self-auto"
          >
            <button
              type="button"
              aria-label="Previous page"
              onClick={() =>
                setPageState({ items, page: Math.max(1, currentPage - 1) })
              }
              disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-black/60 transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
                onClick={() => setPageState({ items, page })}
                className={`h-9 min-w-[2.25rem] rounded-lg px-2 text-xs font-medium transition-colors ${
                  currentPage === page
                    ? "bg-brand-black text-white"
                    : "text-brand-black/60 hover:bg-surface-muted"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              aria-label="Next page"
              onClick={() =>
                setPageState({ items, page: Math.min(pageCount, currentPage + 1) })
              }
              disabled={currentPage === pageCount}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-black/60 transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

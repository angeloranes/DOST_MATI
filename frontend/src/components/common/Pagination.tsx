// components/common/Pagination.tsx

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.05]">
      <span className="text-theme-xs text-gray-400 dark:text-gray-500">
        {currentPage} of {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center justify-center rounded-lg border border-[#e2e8f0] bg-white px-2.5 py-1.5 text-theme-xs font-medium text-[#475569] transition-colors hover:bg-gray-50 hover:text-[#2563eb] hover:border-[#2563eb]/30 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400 dark:hover:text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40 dark:disabled:text-gray-600"
        >
          ← Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-theme-xs font-medium transition-colors ${
              page === currentPage
                ? "bg-[#2563eb] text-white dark:bg-[#2563eb]"
                : "bg-white text-[#475569] border border-[#e2e8f0] hover:bg-gray-50 hover:text-[#2563eb] hover:border-[#2563eb]/30 dark:bg-white/[0.03] dark:border-white/[0.05] dark:text-gray-400 dark:hover:text-[#2563eb]"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center justify-center rounded-lg border border-[#e2e8f0] bg-white px-2.5 py-1.5 text-theme-xs font-medium text-[#475569] transition-colors hover:bg-gray-50 hover:text-[#2563eb] hover:border-[#2563eb]/30 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400 dark:hover:text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40 dark:disabled:text-gray-600"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Pagination Component
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current active page
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalItems - Total number of items
 * @param {number} props.itemsPerPage - Number of items per page
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {Function} props.onItemsPerPageChange - Callback when items per page changes
 * @param {Array<number>} props.itemsPerPageOptions - Options for items per page dropdown (default: [10, 20, 50, 100])
 */
const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    itemsPerPage = 10,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [10, 20, 50, 100]
}) => {
    // Calculate the range of items being displayed
    const startItem = totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Function to render page numbers with ellipsis
    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages + 2) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(renderPageButton(i));
            }
        } else {
            // Always show first page
            pages.push(renderPageButton(1));

            if (currentPage <= 3) {
                // Near the start
                for (let i = 2; i <= 4; i++) {
                    pages.push(renderPageButton(i));
                }
                pages.push(renderEllipsis('end'));
                pages.push(renderPageButton(totalPages));
            } else if (currentPage >= totalPages - 2) {
                // Near the end
                pages.push(renderEllipsis('start'));
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(renderPageButton(i));
                }
            } else {
                // Middle
                pages.push(renderEllipsis('start'));
                pages.push(renderPageButton(currentPage - 1));
                pages.push(renderPageButton(currentPage));
                pages.push(renderPageButton(currentPage + 1));
                pages.push(renderEllipsis('end'));
                pages.push(renderPageButton(totalPages));
            }
        }

        return pages;
    };

    const renderPageButton = (pageNum) => (
        <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                pageNum === currentPage
                    ? 'bg-[#F466A2] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 bg-white border border-gray-200'
            }`}
        >
            {pageNum}
        </button>
    );

    const renderEllipsis = (key) => (
        <div key={key} className="w-9 h-9 flex items-center justify-center text-gray-500">
            ...
        </div>
    );

    // Don't render if there are no items
    if (totalItems === 0) return null;

    return (
        <div className="flex items-center justify-between py-3 px-4 bg-white border-t border-gray-200">
            {/* Left side - Dropdown and results text */}
            <div className="flex items-center gap-4">
                {/* Items per page dropdown */}
                {onItemsPerPageChange && (
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 bg-white cursor-pointer"
                    >
                        {itemsPerPageOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                )}

                {/* Results text */}
                <div className="text-sm text-gray-600">
                    Showing {startItem} to {endItem} of {totalItems} results
                </div>
            </div>

            {/* Right side - Page navigation */}
            <div className="flex items-center gap-2">
                {/* Previous button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors bg-white border border-gray-200"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={18} className="text-gray-600" />
                </button>

                {/* Page numbers */}
                {renderPageNumbers()}

                {/* Next button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors bg-white border border-gray-200"
                    aria-label="Next page"
                >
                    <ChevronRight size={18} className="text-gray-600" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
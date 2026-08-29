import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
	/** Current page (1-based) */
	page: number;
	/** Total item count */
	total: number;
	/** Items per page */
	pageSize: number;
	/** Build URL for a given page number */
	hrefBuilder: (page: number) => string;
	className?: string;
}

/**
 * Generate the list of page numbers to show, with ellipsis gaps.
 * Always shows first, last, current, and neighbours; collapses the rest.
 */
function getPageRange(current: number, totalPages: number): (number | "ellipsis")[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const pages: (number | "ellipsis")[] = [1];

	const left = Math.max(2, current - 1);
	const right = Math.min(totalPages - 1, current + 1);

	if (left > 2) {
		pages.push("ellipsis");
	}

	for (let i = left; i <= right; i++) {
		pages.push(i);
	}

	if (right < totalPages - 1) {
		pages.push("ellipsis");
	}

	pages.push(totalPages);
	return pages;
}

export function Pagination({
	page,
	total,
	pageSize,
	hrefBuilder,
	className,
}: PaginationProps) {
	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	if (totalPages <= 1) return null;

	const pages = getPageRange(page, totalPages);
	const hasPrev = page > 1;
	const hasNext = page < totalPages;

	const linkBase =
		"inline-flex items-center justify-center h-8 min-w-[2rem] rounded-md text-xs font-medium transition-colors";
	const linkActive =
		"gradient-primary text-white shadow-sm";
	const linkHover =
		"border border-border bg-transparent hover:bg-bg-card-hover text-text-primary";
	const linkDisabled =
		"border border-border bg-transparent text-text-muted opacity-40 pointer-events-none";

	return (
		<nav
			role="navigation"
			aria-label="Pagination"
			className={cn("flex items-center justify-between", className)}
		>
			{/* Summary */}
			<span className="text-sm text-text-muted">
				Showing{" "}
				<span className="font-medium text-text-primary">
					{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
				</span>{" "}
				of{" "}
				<span className="font-medium text-text-primary">{total}</span>{" "}
				campaigns
			</span>

			{/* Controls */}
			<div className="flex items-center gap-1">
				{/* Previous */}
				{hasPrev ? (
					<a
						href={hrefBuilder(page - 1)}
						className={cn(linkBase, "gap-1 px-2.5", linkHover)}
						aria-label="Go to previous page"
					>
						<ChevronLeft className="h-3.5 w-3.5" />
						Prev
					</a>
				) : (
					<span
						className={cn(linkBase, "gap-1 px-2.5", linkDisabled)}
						aria-disabled="true"
					>
						<ChevronLeft className="h-3.5 w-3.5" />
						Prev
					</span>
				)}

				{/* Page numbers */}
				{pages.map((p, idx) =>
					p === "ellipsis" ? (
						<span
							key={`ellipsis-${idx}`}
							className={cn(
								linkBase,
								"w-8 text-text-muted",
							)}
						>
							<MoreHorizontal className="h-3.5 w-3.5" />
						</span>
					) : (
						<a
							key={p}
							href={hrefBuilder(p)}
							className={cn(
								linkBase,
								p === page ? linkActive : linkHover,
							)}
							aria-label={`Go to page ${p}`}
							aria-current={p === page ? "page" : undefined}
						>
							{p}
						</a>
					),
				)}

				{/* Next */}
				{hasNext ? (
					<a
						href={hrefBuilder(page + 1)}
						className={cn(linkBase, "gap-1 px-2.5", linkHover)}
						aria-label="Go to next page"
					>
						Next
						<ChevronRight className="h-3.5 w-3.5" />
					</a>
				) : (
					<span
						className={cn(linkBase, "gap-1 px-2.5", linkDisabled)}
						aria-disabled="true"
					>
						Next
						<ChevronRight className="h-3.5 w-3.5" />
					</span>
				)}
			</div>
		</nav>
	);
}

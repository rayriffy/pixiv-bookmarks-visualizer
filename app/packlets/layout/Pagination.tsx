import { Link, useSearch } from "@tanstack/react-router";
import { clsx } from "clsx";
import { memo } from "react";

interface Props {
    max: number;
    current: number;
}

export const Pagination = memo<Props>((props) => {
    const { max, current } = props;

    // Calculate pagination display
    const pageLength: number = max > 5 ? 5 : max;
    const startPoint: number =
        max > 5 ? (current - 2 < 1 ? 0 : current + 2 > max ? max - pageLength : current - (pageLength - 2)) : 0;

    if (max <= 1) return null;

    return (
        <div className="flex justify-center py-8">
            <div className="join">
                {Array.from({ length: pageLength }, (_, i) => {
                    const pageNum = startPoint + i + 1;

                    return (
                        <Link
                            key={`pagination-${startPoint + i}`}
                            to="/"
                            search={(prev) => ({
                                ...prev,
                                page: pageNum,
                            })}
                            className={clsx("join-item btn", current === pageNum ? "btn-active" : "")}
                        >
                            {pageNum}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
});

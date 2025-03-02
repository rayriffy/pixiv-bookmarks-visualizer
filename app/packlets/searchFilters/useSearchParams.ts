import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { serializeFiltersToSearchParams, deserializeURLToFilters } from "./buildURLParams";
import { minimumSizer as defaultMinimumSizer } from "./minimumSizer";
import type { MinimumSizer } from "$types/MinimumSizer";

// Define a TagItem interface for storing both the name and metadata
export interface TagItem {
    id?: string;
    name: string;
    translated?: string | null;
    count?: number;
}

export function useSearchParams() {
    const navigate = useNavigate();
    const searchParams = useSearch({
        from: "/",
    });

    // State for all filter types
    const [includeTags, setIncludeTags] = useState<TagItem[]>([]);
    const [excludeTags, setExcludeTags] = useState<TagItem[]>([]);
    const [restriction, setRestriction] = useState<"all" | "public" | "private">("public");
    const [aspect, setAspect] = useState<"all" | "horizontal" | "vertical">("all");
    const [minimumSizer, setMinimumSizer] = useState<MinimumSizer>(defaultMinimumSizer);
    const [blur, setBlur] = useState<boolean>(false);
    const [aiMode, setAiMode] = useState<"all" | "non-ai-only" | "ai-only">("all");
    const [minimumPageCount, setMinimumPageCount] = useState<string>("0");
    const [maximumPageCount, setMaximumPageCount] = useState<string>("0");

    // Ref to track if we're currently updating from URL
    const isUpdatingFromUrl = useRef(false);

    // Ref for debounce timer
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Get current page number from URL search params
    const getPageNumber = useCallback(() => {
        return typeof searchParams === "object" && "page" in searchParams ? Number(searchParams.page) : 1;
    }, [searchParams]);

    // Initialize state from URL when it changes
    useEffect(() => {
        if (isUpdatingFromUrl.current) return;

        isUpdatingFromUrl.current = true;

        try {
            // Convert search params to URLSearchParams for the deserializer
            const urlParams = new URLSearchParams();
            Object.entries(searchParams).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach((item) => urlParams.append(key, item));
                } else if (value !== undefined) {
                    urlParams.set(key, String(value));
                }
            });

            const filters = deserializeURLToFilters(urlParams);

            // Set states based on URL parameters
            setIncludeTags(filters.includeTags || []);
            setExcludeTags(filters.excludeTags || []);
            setRestriction(filters.restriction || "public");
            setAspect(filters.aspect || "all");
            setBlur(filters.blur || false);
            setAiMode(filters.aiMode || "all");
            setMinimumPageCount(filters.minimumPageCount?.toString() || "0");
            setMaximumPageCount(filters.maximumPageCount?.toString() || "0");
            setMinimumSizer(filters.minimumSizer || defaultMinimumSizer);
        } finally {
            // Use a small timeout to ensure all state updates complete
            setTimeout(() => {
                isUpdatingFromUrl.current = false;
            }, 100);
        }
    }, [searchParams]);

    // Update URL with current filter state
    const updateURL = useCallback(() => {
        if (isUpdatingFromUrl.current) return;

        // Get current page number (or default to 1)
        const pageNumber = getPageNumber();

        // Prepare filter state object
        const filterState = {
            includeTags,
            excludeTags,
            restriction: restriction !== "all" ? restriction : undefined,
            aspect: aspect !== "all" ? aspect : undefined,
            minimumSizer: minimumSizer.size > 0 ? minimumSizer : undefined,
            blur: blur || undefined,
            aiMode: aiMode !== "all" ? aiMode : undefined,
            minimumPageCount: Number(minimumPageCount) > 0 ? Number(minimumPageCount) : undefined,
            maximumPageCount: Number(maximumPageCount) > 0 ? Number(maximumPageCount) : undefined,
        };

        // Serialize to searchParams object
        const searchObj = serializeFiltersToSearchParams(filterState);

        // Add the page parameter
        if (pageNumber > 1) {
            searchObj.page = pageNumber;
        }

        // Navigate with the new search params
        navigate({
            to: "/",
            search: searchObj,
            replace: true,
        });
    }, [
        navigate,
        getPageNumber,
        includeTags,
        excludeTags,
        restriction,
        aspect,
        minimumSizer,
        blur,
        aiMode,
        minimumPageCount,
        maximumPageCount,
    ]);

    // Debounced URL update
    const debouncedUpdateURL = useCallback(() => {
        // Clear any existing timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Set new timer
        debounceTimer.current = setTimeout(() => {
            updateURL();
            debounceTimer.current = null;
        }, 200) as unknown as NodeJS.Timeout;
    }, [updateURL]);

    // Watch for filter changes and update URL
    useEffect(() => {
        if (isUpdatingFromUrl.current) return;
        debouncedUpdateURL();

        // Cleanup
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }
        };
    }, [
        includeTags,
        excludeTags,
        restriction,
        aspect,
        minimumSizer,
        blur,
        aiMode,
        minimumPageCount,
        maximumPageCount,
        debouncedUpdateURL,
    ]);

    // Search payload for API requests
    const searchPayload = useCallback(() => {
        const pageNumber = getPageNumber();
        const includeTagNames = includeTags.map((tag) => tag.name);
        const excludeTagNames = excludeTags.map((tag) => tag.name);

        return {
            page: pageNumber.toString(),
            includeTags: includeTagNames,
            excludeTags: excludeTagNames,
            restrict: restriction,
            aspect,
            sizerMode: minimumSizer.mode,
            sizerSize: minimumSizer.size.toString(),
            aiMode,
            minimumPageCount,
            maximumPageCount,
        };
    }, [
        getPageNumber,
        includeTags,
        excludeTags,
        restriction,
        aspect,
        minimumSizer.mode,
        minimumSizer.size,
        aiMode,
        minimumPageCount,
        maximumPageCount,
    ]);

    return {
        // Filter values
        includeTags,
        excludeTags,
        restriction,
        aspect,
        minimumSizer,
        blur,
        aiMode,
        minimumPageCount,
        maximumPageCount,

        // Setters
        setIncludeTags,
        setExcludeTags,
        setRestriction,
        setAspect,
        setMinimumSizer,
        setBlur,
        setAiMode,
        setMinimumPageCount,
        setMaximumPageCount,

        // Helper function for API requests
        searchPayload,
    };
}

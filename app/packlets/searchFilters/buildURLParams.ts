export const buildURLParams = (input: Record<string, string | string[] | number | boolean>) => {
    return new URLSearchParams(
        Object.entries(input).flatMap(([key, val]) => {
            if (typeof val !== "object") return [[key, String(val)]];
            // Convert each array item to string
            return (val as string[]).map((o) => [key, String(o)]);
        }),
    ).toString();
};

/**
 * Serializes search filter state to URL search params string
 */
export const serializeFiltersToSearchParams = (filters: {
    includeTags?: Array<{ id?: string; name: string }>;
    excludeTags?: Array<{ id?: string; name: string }>;
    restriction?: "all" | "public" | "private";
    aspect?: "all" | "horizontal" | "vertical";
    minimumSizer?: { mode: "width" | "height" | "none"; size: number };
    blur?: boolean;
    aiMode?: "all" | "non-ai-only" | "ai-only";
    minimumPageCount?: number | string;
    maximumPageCount?: number | string;
}) => {
    let searchParams: Record<string, string | string[] | number | boolean> = {};

    // Handle tags - only store the tag name for shorter URLs
    if (filters.includeTags && filters.includeTags.length > 0) {
        searchParams["includes"] = filters.includeTags.map((tag) => tag.name);
    }

    if (filters.excludeTags && filters.excludeTags.length > 0) {
        searchParams["excludes"] = filters.excludeTags.map((tag) => tag.name);
    }

    // Handle primitives and simple options
    if (filters.restriction && filters.restriction !== "all") {
        searchParams["restriction"] = filters.restriction;
    }

    if (filters.aspect && filters.aspect !== "all") {
        searchParams["aspect"] = filters.aspect;
    }

    if (filters.blur) {
        searchParams["blur"] = filters.blur;
    }

    if (filters.aiMode && filters.aiMode !== "all") {
        searchParams["aiMode"] = filters.aiMode;
    }

    // Handle page count - convert to number first to handle "0" value properly
    const minPages =
        typeof filters.minimumPageCount === "string"
            ? Number.parseInt(filters.minimumPageCount, 10)
            : filters.minimumPageCount;

    const maxPages =
        typeof filters.maximumPageCount === "string"
            ? Number.parseInt(filters.maximumPageCount, 10)
            : filters.maximumPageCount;

    if (minPages && minPages > 0) {
        searchParams["minPages"] = minPages;
    }

    if (maxPages && maxPages > 0) {
        searchParams["maxPages"] = maxPages;
    }

    // Handle size filters
    if (
        filters.minimumSizer?.mode &&
        filters.minimumSizer.mode !== "none" &&
        filters.minimumSizer.size &&
        filters.minimumSizer.size > 0
    ) {
        searchParams["sizerMode"] = filters.minimumSizer.mode;
        searchParams["sizerSize"] = filters.minimumSizer.size;
    }

    return searchParams;
};

/**
 * Deserializes URL search params to filter state
 */
export const deserializeURLToFilters = (query: URLSearchParams) => {
    interface FilterState {
        includeTags: Array<{ name: string; id?: string; translated?: string | null }>;
        excludeTags: Array<{ name: string; id?: string; translated?: string | null }>;
        restriction: "all" | "public" | "private";
        aspect: "all" | "horizontal" | "vertical";
        blur: boolean;
        aiMode: "all" | "non-ai-only" | "ai-only";
        minimumPageCount: string;
        maximumPageCount: string;
        minimumSizer: {
            mode: "none" | "width" | "height";
            size: number;
        };
    }

    const filters: FilterState = {
        includeTags: [],
        excludeTags: [],
        restriction: "all",
        aspect: "all",
        blur: false,
        aiMode: "all",
        minimumPageCount: "0",
        maximumPageCount: "0",
        minimumSizer: {
            mode: "none",
            size: 0,
        },
    };

    // Parse tag names and create simple tag objects
    const processIncludeTags = () => {
        // First check if we have a single includes param that might be an array (TanStack router)
        const includesParam = query.get("includes");
        if (includesParam) {
            try {
                // Check if it's a JSON array from TanStack router
                const parsedIncludes = JSON.parse(includesParam);
                if (Array.isArray(parsedIncludes)) {
                    // Process each tag in the array
                    parsedIncludes.forEach((tagName) => {
                        if (tagName && typeof tagName === "string") {
                            filters.includeTags.push({ name: tagName });
                        }
                    });
                    return; // We've processed the array format, no need to continue
                }
            } catch (_err) {
                // Not a valid JSON array, continue with normal processing
                // If it's a comma-separated string (which might happen with TanStack Router)
                if (typeof includesParam === "string" && includesParam.includes(",")) {
                    includesParam.split(",").forEach((tagName) => {
                        const trimmedTag = tagName.trim();
                        if (trimmedTag) {
                            filters.includeTags.push({ name: trimmedTag });
                        }
                    });
                    return;
                }
            }
        }

        // Fall back to processing individual params (NextJS style)
        for (const encodedTag of query.getAll("includes")) {
            try {
                // Try to handle JSON format for backward compatibility
                const tagObj = JSON.parse(decodeURIComponent(encodedTag));
                if (tagObj?.name) {
                    filters.includeTags.push(tagObj);
                }
            } catch (_err) {
                // Not JSON - just use the tag name directly
                const tagName = decodeURIComponent(encodedTag);
                if (tagName) {
                    filters.includeTags.push({ name: tagName });
                }
            }
        }
    };

    const processExcludeTags = () => {
        // First check if we have a single excludes param that might be an array (TanStack router)
        const excludesParam = query.get("excludes");
        if (excludesParam) {
            try {
                // Check if it's a JSON array from TanStack router
                const parsedExcludes = JSON.parse(excludesParam);
                if (Array.isArray(parsedExcludes)) {
                    // Process each tag in the array
                    parsedExcludes.forEach((tagName) => {
                        if (tagName && typeof tagName === "string") {
                            filters.excludeTags.push({ name: tagName });
                        }
                    });
                    return; // We've processed the array format, no need to continue
                }
            } catch (_err) {
                // Not a valid JSON array, continue with normal processing
                // If it's a comma-separated string (which might happen with TanStack Router)
                if (typeof excludesParam === "string" && excludesParam.includes(",")) {
                    excludesParam.split(",").forEach((tagName) => {
                        const trimmedTag = tagName.trim();
                        if (trimmedTag) {
                            filters.excludeTags.push({ name: trimmedTag });
                        }
                    });
                    return;
                }
            }
        }

        // Fall back to processing individual params (NextJS style)
        for (const encodedTag of query.getAll("excludes")) {
            try {
                // Try to handle JSON format for backward compatibility
                const tagObj = JSON.parse(decodeURIComponent(encodedTag));
                if (tagObj?.name) {
                    filters.excludeTags.push(tagObj);
                }
            } catch (_err) {
                // Not JSON - just use the tag name directly
                const tagName = decodeURIComponent(encodedTag);
                if (tagName) {
                    filters.excludeTags.push({ name: tagName });
                }
            }
        }
    };

    processIncludeTags();
    processExcludeTags();

    // Parse simple options
    if (query.has("restriction")) {
        const value = query.get("restriction");
        filters.restriction = value === "public" || value === "private" ? value : "all";
    }

    if (query.has("aspect")) {
        const value = query.get("aspect");
        filters.aspect = value === "horizontal" || value === "vertical" ? value : "all";
    }

    if (query.has("blur")) {
        filters.blur = query.get("blur") === "true";
    }

    if (query.has("aiMode")) {
        const value = query.get("aiMode");
        filters.aiMode = value === "non-ai-only" || value === "ai-only" ? value : "all";
    }

    // Parse page counts
    if (query.has("minPages")) {
        const value = query.get("minPages");
        filters.minimumPageCount = value || "0";
    }

    if (query.has("maxPages")) {
        const value = query.get("maxPages");
        filters.maximumPageCount = value || "0";
    }

    // Parse size filters
    if (query.has("sizerMode") && query.has("sizerSize")) {
        const mode = query.get("sizerMode");
        filters.minimumSizer = {
            mode: mode === "width" || mode === "height" ? mode : "none",
            size: Number(query.get("sizerSize")) || 0,
        };
    }

    return filters;
};

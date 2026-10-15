import type { MinimumSizer } from "$types/MinimumSizer";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { type SetStateAction, useCallback, useMemo, useRef, useState } from "react";
import { deserializeURLToFilters, serializeFiltersToSearchParams } from "./buildURLParams";

export interface TagItem {
    id?: string;
    name: string;
    translated?: string | null;
    count?: number;
}

type Filters = ReturnType<typeof deserializeURLToFilters>;
type Search = Record<string, unknown>;

function readFilters(search: Search): Filters {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
        if (value !== undefined) {
            params.set(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
        }
    }
    return deserializeURLToFilters(params);
}

/** URL state is the shared authority for every control and illustration. */
export function useSearchParams() {
    const navigate = useNavigate();
    const search = useSearch({ from: "/" });
    const filters = useMemo(() => readFilters(search), [search]);
    const [metadata, setMetadata] = useState<Record<string, TagItem>>({});
    const includeTags = useMemo(() => filters.includeTags.map((tag) => metadata[tag.name] ?? tag), [filters, metadata]);
    const excludeTags = useMemo(() => filters.excludeTags.map((tag) => metadata[tag.name] ?? tag), [filters, metadata]);
    const current = useRef({ ...filters, includeTags, excludeTags });
    current.current = { ...filters, includeTags, excludeTags };

    const setters = useMemo(() => {
        function setter<K extends keyof Filters>(key: K) {
            return (action: SetStateAction<Filters[K]>) => {
                const previous = current.current[key];
                const next = typeof action === "function" ? action(previous) : action;
                if (key === "includeTags" || key === "excludeTags") {
                    const tags = next as TagItem[];
                    setMetadata((existing) => {
                        const changed = tags.filter(
                            (tag) =>
                                tag.translated !== existing[tag.name]?.translated ||
                                tag.count !== existing[tag.name]?.count,
                        );
                        if (changed.length === 0) return existing;
                        return { ...existing, ...Object.fromEntries(changed.map((tag) => [tag.name, tag])) };
                    });
                    if (
                        JSON.stringify((previous as TagItem[]).map((tag) => tag.name)) ===
                        JSON.stringify(tags.map((tag) => tag.name))
                    ) {
                        return;
                    }
                } else if (JSON.stringify(previous) === JSON.stringify(next)) {
                    return;
                }
                current.current = { ...current.current, [key]: next };
                void navigate({
                    to: "/",
                    replace: true,
                    search: (previousSearch) => {
                        const updated = { ...readFilters(previousSearch), [key]: next };
                        const result = serializeFiltersToSearchParams(updated);
                        if (Number(previousSearch.page) > 1) result.page = Number(previousSearch.page);
                        return result;
                    },
                });
            };
        }
        return {
            setIncludeTags: setter("includeTags"),
            setExcludeTags: setter("excludeTags"),
            setRestriction: setter("restriction"),
            setAspect: setter("aspect"),
            setMinimumSizer: setter("minimumSizer") as (action: SetStateAction<MinimumSizer>) => void,
            setBlur: setter("blur"),
            setAiMode: setter("aiMode"),
            setMinimumPageCount: setter("minimumPageCount"),
            setMaximumPageCount: setter("maximumPageCount"),
        };
    }, [navigate]);

    const searchPayload = useCallback(
        () => ({
            page: String(Number(search.page) || 1),
            includeTags: includeTags.map((tag) => tag.name),
            excludeTags: excludeTags.map((tag) => tag.name),
            restrict: filters.restriction,
            aspect: filters.aspect,
            sizerMode: filters.minimumSizer.mode,
            sizerSize: String(filters.minimumSizer.size),
            aiMode: filters.aiMode,
            minimumPageCount: filters.minimumPageCount,
            maximumPageCount: filters.maximumPageCount,
        }),
        [search, filters, includeTags, excludeTags],
    );

    return { ...filters, includeTags, excludeTags, ...setters, searchPayload };
}

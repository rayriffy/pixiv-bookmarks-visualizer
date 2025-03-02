import { createFileRoute } from "@tanstack/react-router";
import { SearchFilters } from "$searchFilters/SearchFilters";
import { TopTags } from "$topTags/TopTags";
import { useSearchParams } from "$searchFilters/useSearchParams";
import useSWR from "swr";
import type { Tag } from "$types/Tag";
import { buildURLParams } from "$searchFilters/buildURLParams";
import type { SearchResult } from "$types/SearchResult";
import { useEffect } from "react";
import { updateTagCounts } from "$navigate/updateTagCounts";
import { Pagination } from "$layout/Pagination";
import { Illust } from "$layout/Illust";

export const Route = createFileRoute("/")({
    component: Home,
});

function Home() {
    // Use TanStack search params directly to make component re-render on search changes
    const { setIncludeTags, setExcludeTags, searchPayload } = useSearchParams();

    const { data, error } = useSWR<SearchResult, Error, string>(`/api/search?${buildURLParams(searchPayload())}`);
    const { data: topTagsResponse } = useSWR<{ tags: Tag[] }, Error, string>(
        `/api/topTags?${buildURLParams(searchPayload())}`,
    );

    // Update tag counts when top tags data changes
    useEffect(() => {
        if (topTagsResponse?.tags && topTagsResponse.tags.length > 0) {
            // Always update both include and exclude tags when topTags data changes
            // This ensures tags are always updated with the latest counts and translations
            setIncludeTags((prev) => updateTagCounts(prev, topTagsResponse.tags));
            setExcludeTags((prev) => updateTagCounts(prev, topTagsResponse.tags));
        }
    }, [
        topTagsResponse,
        setIncludeTags,
        setExcludeTags,
        // Remove the length dependencies as they're not needed
        // We always want to run the update when topTagsResponse changes
    ]);

    return (
        <main className="p-4">
            <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SearchFilters />
                <TopTags tags={topTagsResponse?.tags ?? []} />
            </section>
            <div className="py-6">
                {!data && !error ? (
                    <h1>Loading</h1>
                ) : error ? (
                    <h1>Failed to fetch</h1>
                ) : (
                    <section>
                        <div className="my-1">
                            <h2 className="text-sm">
                                <span className="font-bold">{(data?.count ?? -1).toLocaleString()} images</span> found,
                                with a total of
                                <span className="font-bold">{data?.paginate.max.toLocaleString()} pages</span>
                            </h2>
                        </div>
                        <Pagination {...data!.paginate} />
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12 items-center">
                            {data?.illusts.map((illust) => (
                                <Illust key={`illust-${illust.id}`} illust={illust} />
                            ))}
                        </div>
                        <Pagination {...data!.paginate} />
                    </section>
                )}
            </div>
        </main>
    );
}

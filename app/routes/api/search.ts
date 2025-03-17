import { parseQuery, withErrorHandling } from "$api/apiUtils";
import { searchIllusts } from "$api/searchIllusts";
import type { SearchRequest } from "$types/SearchRequest";
import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/search")({
    GET: withErrorHandling(async ({ request }) => {
        const searchRequest = parseQuery<SearchRequest>(request);
        const searchResults = await searchIllusts(searchRequest);
        return json(searchResults);
    }, "Search"),
});

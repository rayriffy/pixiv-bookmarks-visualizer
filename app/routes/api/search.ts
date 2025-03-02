import type { SearchRequest } from "$types/SearchRequest";
import { searchIllusts } from "$api/searchIllusts";
import { parseQuery, withErrorHandling } from "$api/apiUtils";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { json } from "@tanstack/react-start";

export const APIRoute = createAPIFileRoute("/api/search")({
    GET: withErrorHandling(async ({ request }) => {
        const searchRequest = parseQuery<SearchRequest>(request);
        const searchResults = await searchIllusts(searchRequest);
        return json(searchResults);
    }, "Search"),
});

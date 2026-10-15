import { methodNotAllowed, parseQuery, withErrorHandling } from "$api/apiUtils";
import { searchIllusts } from "$api/searchIllusts";
import type { SearchRequest } from "$types/SearchRequest";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/search")({
    server: {
        handlers: {
            ANY: methodNotAllowed,
            GET: withErrorHandling(async ({ request }) => {
                const searchRequest = parseQuery<SearchRequest>(request);
                const searchResults = await searchIllusts(searchRequest);
                return Response.json(searchResults);
            }, "Search"),
        },
    },
});

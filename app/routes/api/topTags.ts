import { methodNotAllowed, parseQuery, withErrorHandling } from "$api/apiUtils";
import { getTopTags } from "$api/getTopTags";
import type { SearchRequest } from "$types/SearchRequest";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/topTags")({
    server: {
        handlers: {
            ANY: methodNotAllowed,
            GET: withErrorHandling(async ({ request }) => {
                const searchRequest = parseQuery<SearchRequest>(request);
                const topTags = await getTopTags(searchRequest);
                return Response.json(topTags);
            }, "Top tags"),
        },
    },
});

import { parseQuery, withErrorHandling } from "$api/apiUtils";
import { getTopTags } from "$api/getTopTags";
import type { SearchRequest } from "$types/SearchRequest";
import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/topTags")({
    GET: withErrorHandling(async ({ request }) => {
        const searchRequest = parseQuery<SearchRequest>(request);
        const topTags = await getTopTags(searchRequest);
        return json(topTags);
    }, "Top tags"),
});

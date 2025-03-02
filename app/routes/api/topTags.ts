import type { SearchRequest } from "$types/SearchRequest";
import { parseQuery, withErrorHandling } from "$api/apiUtils";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { json } from "@tanstack/react-start";
import { getTopTags } from "$api/getTopTags";

export const APIRoute = createAPIFileRoute("/api/topTags")({
    GET: withErrorHandling(async ({ request }) => {
        const searchRequest = parseQuery<SearchRequest>(request);
        const topTags = await getTopTags(searchRequest);
        return json(topTags);
    }, "Top tags"),
});

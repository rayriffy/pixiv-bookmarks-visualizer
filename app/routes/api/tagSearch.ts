import type { TagSearchRequest } from "$types/TagSearchRequest";
import { searchTags } from "$api/searchTags";
import { parseQuery, withErrorHandling } from "$api/apiUtils";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { json } from "@tanstack/react-start";

export const APIRoute = createAPIFileRoute("/api/tagSearch")({
    GET: withErrorHandling(async ({ request }) => {
        let tagSearchRequest = parseQuery<TagSearchRequest>(request);

        const results = await searchTags(tagSearchRequest);
        return json(results);
    }, "Tag search"),
});

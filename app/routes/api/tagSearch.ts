import { parseQuery, withErrorHandling } from "$api/apiUtils";
import { searchTags } from "$api/searchTags";
import type { TagSearchRequest } from "$types/TagSearchRequest";
import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/tagSearch")({
    GET: withErrorHandling(async ({ request }) => {
        let tagSearchRequest = parseQuery<TagSearchRequest>(request);

        const results = await searchTags(tagSearchRequest);
        return json(results);
    }, "Tag search"),
});

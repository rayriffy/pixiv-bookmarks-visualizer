import { methodNotAllowed, parseQuery, withErrorHandling } from "$api/apiUtils";
import { searchTags } from "$api/searchTags";
import type { TagSearchRequest } from "$types/TagSearchRequest";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tagSearch")({
    server: {
        handlers: {
            ANY: methodNotAllowed,
            GET: withErrorHandling(async ({ request }) => {
                const tagSearchRequest = parseQuery<TagSearchRequest>(request);
                const results = await searchTags(tagSearchRequest);
                return Response.json(results);
            }, "Tag search"),
        },
    },
});

import { methodNotAllowed } from "$api/apiUtils";
import { getPixivImageAndCache } from "$api/getPixivImageAndCache";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/pixivProxy")({
    server: {
        handlers: {
            ANY: methodNotAllowed,
            GET: async ({ request }) => {
                const url = new URL(request.url).searchParams.get("url");
                if (!url) return Response.json({ message: "Invalid request" }, { status: 400 });
                const imageData = await getPixivImageAndCache(url);
                return new Response(new Uint8Array(imageData), {
                    status: 200,
                    headers: { "content-type": "image/webp" },
                });
            },
        },
    },
});

import { getPixivImageAndCache } from "$api/getPixivImageAndCache";
import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/pixivProxy")({
    GET: async ({ request }) => {
        const url = new URL(request.url).searchParams.get("url");
        if (!url) return json({ message: "Invalid request" }, { status: 400 });
        const imageData = await getPixivImageAndCache(url);
        return new Response(imageData, {
            status: 200,
            headers: { "content-type": "image/webp" },
        });
    },
});

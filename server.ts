import path from "node:path";
import { Glob, file, serve } from "bun";

// Vite emits Start's default fetch handler. Bun also serves the built client assets.
const entryUrl = new URL("./dist/server/server.js", import.meta.url).href;
const { default: handler } = (await import(entryUrl)) as {
    default: { fetch: (request: Request) => Response | Promise<Response> };
};
const clientDirectory = path.join(import.meta.dir, "dist/client");
const assets = new Map<string, string>();
for await (const asset of new Glob("**/*").scan({ cwd: clientDirectory, onlyFiles: true })) {
    assets.set(`/${encodeURI(asset)}`, path.join(clientDirectory, asset));
}

const server = serve({
    port: Number(process.env.PORT ?? 3000),
    hostname: process.env.HOST ?? "0.0.0.0",
    async fetch(request) {
        const pathname = new URL(request.url).pathname;
        const assetPath = assets.get(pathname);
        if (assetPath && (request.method === "GET" || request.method === "HEAD")) {
            const asset = file(assetPath);
            return new Response(request.method === "HEAD" ? null : asset, {
                headers: {
                    "Content-Type": asset.type,
                    "Content-Length": String(asset.size),
                    "Cache-Control": pathname.startsWith("/assets/")
                        ? "public, max-age=31536000, immutable"
                        : "public, max-age=0, must-revalidate",
                },
            });
        }
        if (pathname.startsWith("/assets/")) return new Response("Not found", { status: 404 });
        return handler.fetch(request);
    },
});

console.log(`Listening on ${server.url}`);

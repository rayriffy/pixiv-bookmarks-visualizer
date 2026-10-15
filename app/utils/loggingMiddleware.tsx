import { createMiddleware } from "@tanstack/react-start";

export const logMiddleware = createMiddleware({ type: "request" }).server(async ({ request, next }) => {
    const start = performance.now();
    try {
        return await next();
    } finally {
        console.log("Request:", request.method, new URL(request.url).pathname, {
            duration: performance.now() - start,
        });
    }
});

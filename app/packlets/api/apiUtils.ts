type APIHandler = (context: { request: Request }) => Response | Promise<Response>;

export const methodNotAllowed = () =>
    new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });

/**
 * Common error response structure
 */
interface ErrorResponse {
    error: string;
    message: string;
}

/**
 * Wrap API handler with common error handling
 */
export const withErrorHandling = (handler: APIHandler, errorPrefix = "API"): APIHandler => {
    return async (context) => {
        try {
            return await handler(context);
        } catch (error) {
            console.error(`${errorPrefix} error:`, error);
            return Response.json(
                {
                    error: `An error occurred during ${errorPrefix.toLowerCase()}`,
                    message: error instanceof Error ? error.message : String(error),
                } as ErrorResponse,
                {
                    status: 500,
                },
            );
        }
    };
};
//
// /**
//  * Type-safe query parser for API requests
//  */
export const parseQuery = <T>(request: Request): T => {
    // Get the URL from the Request object
    const url = new URL(request.url);

    // Create an object to store the parsed parameters
    const searchParams: Record<string, string | string[]> = {};

    // Iterate through all search parameters
    for (const [key, value] of url.searchParams.entries()) {
        // If this key already exists in our result object
        if (key in searchParams) {
            // If it's already an array, push the new value
            if (Array.isArray(searchParams[key])) {
                (searchParams[key] as string[]).push(value);
            }
            // If it's a string, convert it to an array with both values
            else {
                searchParams[key] = [searchParams[key] as string, value];
            }
        }
        // First occurrence of this key
        else {
            searchParams[key] = value;
        }
    }

    return searchParams as T;
};
//
// /**
//  * Send a successful JSON response with cache control
//  */
// export const sendCachedResponse = <T>(
//   res: NextApiResponse,
//   data: T,
//   maxAge = 300
// ): void => {
//   setCacheControl(res, maxAge)
//   res.send(data)
// }

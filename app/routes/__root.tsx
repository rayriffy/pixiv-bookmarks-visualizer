import appCss from "$layout/app.css?url";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { SWRConfig } from "swr";

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {
                charSet: "utf-8",
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
        ],
        links: [{ rel: "stylesheet", href: appCss }],
    }),
    component: RootComponent,
});

function RootComponent() {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                <SWRConfig
                    value={{
                        fetcher: (resource, init) => fetch(resource, init).then((res) => res.json()),
                    }}
                >
                    <Outlet />
                </SWRConfig>
                <TanStackRouterDevtools position="bottom-right" />
                <Scripts />
            </body>
        </html>
    );
}

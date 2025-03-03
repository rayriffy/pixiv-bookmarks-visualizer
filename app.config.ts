import tailwind from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    vite: {
        plugins: [
            tailwind(),
            tsConfigPaths({
                projects: ["./tsconfig.json"],
            }),
        ],
    },
    server: {
        preset: "bun",
        serveStatic: "node"
    },
});

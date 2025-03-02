import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
    vite: {
        resolve: {
            alias: {
                "react-windowed-select": "react-windowed-select/dist/main.js",
            },
        },
        plugins: [
            tailwind(),
            tsConfigPaths({
                projects: ["./tsconfig.json"],
            }),
        ],
    },
    server: {
        preset: "bun",
    },
});

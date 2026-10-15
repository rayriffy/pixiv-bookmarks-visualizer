import tailwind from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    resolve: { tsconfigPaths: true },
    plugins: [tailwind(), tanstackStart({ srcDirectory: "app" }), react()],
    server: { port: 3000 },
});

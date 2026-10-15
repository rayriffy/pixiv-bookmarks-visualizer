import { describe, expect, spyOn, test } from "bun:test";
import { parseQuery, withErrorHandling } from "../../app/packlets/api/apiUtils";
import {
    deserializeURLToFilters,
    serializeFiltersToSearchParams,
} from "../../app/packlets/searchFilters/buildURLParams";

describe("API contracts", () => {
    test("repeated query parameters preserve both Japanese tags", () => {
        const request = new Request(
            "http://localhost/api/search?includeTags=%E7%8C%AB&includeTags=%E5%85%B1%E9%80%9A&page=2",
        );
        expect(parseQuery<{ includeTags: string[]; page: string }>(request)).toEqual({
            includeTags: ["猫", "共通"],
            page: "2",
        });
    });

    test("asynchronous errors return the established JSON error envelope", async () => {
        const log = spyOn(console, "error").mockImplementation(() => {});
        try {
            const handler = withErrorHandling(async () => {
                await Promise.resolve();
                throw new Error("Database unavailable");
            }, "Search");
            const response = await handler({ request: new Request("http://localhost/api/search") });
            expect(response.status).toBe(500);
            expect(await response.json()).toEqual({
                error: "An error occurred during search",
                message: "Database unavailable",
            });
        } finally {
            log.mockRestore();
        }
    });
});

describe("saved URL contracts", () => {
    test("size mode survives selecting an axis before entering a pixel value", () => {
        expect(serializeFiltersToSearchParams({ minimumSizer: { mode: "width", size: 0 } })).toEqual({
            sizerMode: "width",
            sizerSize: 0,
        });
    });
    test.each([
        ["includes=%E7%8C%AB&includes=%E5%85%B1%E9%80%9A", ["猫", "共通"]],
        [`includes=${encodeURIComponent(JSON.stringify(["猫", "共通"]))}`, ["猫", "共通"]],
        [`includes=${encodeURIComponent(JSON.stringify({ name: "猫" }))}`, ["猫"]],
        ["includes=%E7%8C%AB,%E5%85%B1%E9%80%9A", ["猫", "共通"]],
    ])("restores %s", (query, expected) => {
        expect(deserializeURLToFilters(new URLSearchParams(query)).includeTags.map((tag) => tag.name)).toEqual(
            expected,
        );
    });

    test("all filters survive a serialization round trip", () => {
        const filters = {
            includeTags: [{ name: "猫" }],
            excludeTags: [{ name: "R-18" }],
            restriction: "private" as const,
            aspect: "horizontal" as const,
            blur: true,
            aiMode: "non-ai-only" as const,
            minimumPageCount: "2",
            maximumPageCount: "5",
            minimumSizer: { mode: "width" as const, size: 1920 },
        };
        const params = serializeFiltersToSearchParams(filters);
        const url = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            url.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
        }
        expect(deserializeURLToFilters(url)).toEqual(filters);
    });
});

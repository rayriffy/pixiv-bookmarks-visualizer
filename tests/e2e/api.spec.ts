import { expect, test } from "@playwright/test";
import type { SearchResult } from "../../app/packlets/types/SearchResult";
import type { TagSearchResponse } from "../../app/packlets/types/TagSearchResponse";

test("search preserves sorting, relationships, and 30-item pagination", async ({ request }) => {
    const response = await request.get("/api/search");
    expect(response.status()).toBe(200);
    const data: SearchResult = await response.json();
    expect(data.count).toBe(36);
    expect(data.paginate).toEqual({ current: 1, max: 2 });
    expect(data.illusts).toHaveLength(30);
    expect(data.illusts.map((illust) => illust.id)).toEqual(Array.from({ length: 30 }, (_, i) => 1_000_036 - i));
    expect(data.illusts[0].user.name).toBe("Fixture Artist");
    expect(data.illusts[0].tags.map((tag) => tag.name)).toContain("共通");
    const pageTwo: SearchResult = await (await request.get("/api/search?page=2")).json();
    expect(pageTwo.illusts.map((illust) => illust.id)).toEqual([1000006, 1000005, 1000004, 1000003, 1000002, 1000001]);
});

for (const [query, count] of [
    ["restrict=public", 27],
    ["restrict=private", 9],
    ["aspect=horizontal", 18],
    ["aspect=vertical", 18],
    ["sizerMode=width&sizerSize=1920", 18],
    ["sizerMode=height&sizerSize=1600", 18],
    ["aiMode=ai-only", 12],
    ["aiMode=non-ai-only", 24],
    ["minimumPageCount=2", 7],
    ["maximumPageCount=1", 29],
    ["minimumPageCount=2&maximumPageCount=3&restrict=private", 1],
] as const) {
    test(`API filter: ${query}`, async ({ request }) => {
        const response = await request.get(`/api/search?${query}`);
        expect(response.status()).toBe(200);
        expect((await response.json()).count).toBe(count);
    });
}

test("include and exclude tags compose, including repeated Japanese parameters", async ({ request }) => {
    const query = new URLSearchParams();
    query.append("includeTags", "猫");
    query.append("includeTags", "共通");
    query.append("excludeTags", "R-18");
    const data: SearchResult = await (await request.get(`/api/search?${query}`)).json();
    expect(data.count).toBe(15);
    expect(data.illusts.every((illust) => illust.tags.some((tag) => tag.name === "猫"))).toBe(true);
    expect(data.illusts.every((illust) => !illust.tags.some((tag) => tag.name === "R-18"))).toBe(true);
    const empty: SearchResult = await (await request.get("/api/search?includeTags=missing-tag")).json();
    expect(empty).toEqual({ illusts: [], count: 0, paginate: { current: 1, max: 0 } });
});

test("tag search supports Japanese, English, selected context, exclusions, and limits", async ({ request }) => {
    for (const query of ["猫", "Cat", "cat"]) {
        const response = await request.get(`/api/tagSearch?query=${encodeURIComponent(query)}`);
        expect(response.status()).toBe(200);
        expect((await response.json()).tags).toEqual([{ name: { original: "猫", translated: "Cat" }, count: 18 }]);
    }
    const params = new URLSearchParams({ selectedTags: "猫", alreadySelectedTags: "猫", limit: "1" });
    const data: TagSearchResponse = await (await request.get(`/api/tagSearch?${params}`)).json();
    expect(data.tags).toEqual([{ name: { original: "共通", translated: "Common" }, count: 18 }]);
});

test("top tags follow the active filters and keep included tag metadata", async ({ request }) => {
    const data: TagSearchResponse = await (await request.get("/api/topTags?restrict=private")).json();
    expect(data.tags.find((tag) => tag.name.original === "共通")?.count).toBe(9);
    expect(data.tags.some((tag) => tag.name.original === "猫")).toBe(false);
    const included = await (await request.get(`/api/topTags?includeTags=${encodeURIComponent("猫")}`)).json();
    expect(included.tags[0]).toMatchObject({
        name: { original: "猫", translated: "Cat" },
        count: 18,
        isIncludeTag: true,
    });
});

test("image routes serve cached WebP, animated WebP, and the unconverted animation fallback", async ({ request }) => {
    const invalid = await request.get("/api/pixivProxy");
    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toEqual({ message: "Invalid request" });
    const image = await request.get("/api/pixivProxy?url=https://fixture.invalid/1000035_p0.jpg");
    const fallback = await request.get("/api/ugoiraProxy?illustId=1000035");
    const animation = await request.get("/api/ugoiraProxy?illustId=1000036");
    for (const response of [image, fallback, animation]) {
        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toBe("image/webp");
        expect((await response.body()).subarray(0, 4).toString()).toBe("RIFF");
    }
    expect(await fallback.body()).toEqual(await image.body());
    expect((await animation.body()).includes(Buffer.from("ANIM"))).toBe(true);
});

test("SSR and assets work without JavaScript, unknown paths remain 404", async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain("Search filters");
    expect(html).toContain("pixiv Bookmarks Visualizer");
    const assets = [...html.matchAll(/(?:src|href)="(\/[^" ]+)"/g)].map((match) => match[1]);
    expect(assets.length).toBeGreaterThanOrEqual(2);
    for (const asset of assets) {
        expect((await request.get(asset)).status()).toBe(200);
        const head = await request.head(asset);
        expect(head.status()).toBe(200);
        expect(await head.body()).toHaveLength(0);
    }
    expect((await request.get("/assets/missing.js")).status()).toBe(404);
    expect((await request.get("/missing-route")).status()).toBe(404);
    expect((await request.post("/api/search")).status()).toBe(405);
});

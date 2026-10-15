import { test as base, expect } from "@playwright/test";

const test = base.extend<{ consoleErrors: string[] }>({
    consoleErrors: [
        async ({ page }, use) => {
            const errors: string[] = [];
            page.on("pageerror", (error) => errors.push(error.message));
            page.on("console", (message) => {
                if (
                    message.type() === "error" ||
                    /hydration|did not match|server rendered HTML/i.test(message.text())
                ) {
                    errors.push(message.text().slice(0, 300));
                }
            });
            await use(errors);
            expect(errors, "no browser runtime or hydration errors").toEqual([]);
        },
        { auto: true },
    ],
});

test("renders real results, styles, resolution links, and responsive controls", async ({ page }, testInfo) => {
    await page.goto("/");
    await expect(page).toHaveTitle("pixiv Bookmarks Visualizer");
    await expect(page.getByText("36 images", { exact: true })).toBeVisible();
    await expect(page.getByRole("group", { name: "Search filters", exact: true })).toBeVisible();
    await expect(page.locator("vite-error-overlay")).toHaveCount(0);
    const image = page.getByAltText("Fixture illustration 36", { exact: true });
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(48);
    await expect(page.getByRole("link", { name: "1920 x 1080", exact: true }).first()).toHaveAttribute(
        "href",
        "https://www.pixiv.net/artworks/1000036",
    );
    await expect.poll(() => page.locator("main").evaluate((element) => getComputedStyle(element).padding)).toBe("16px");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("results.png"), fullPage: false });
});

test("bookmark type and orientation controls change results and persist on reload", async ({ page }) => {
    await page.goto("/?restriction=public");
    await expect(page.getByText("27 images", { exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: "Private", exact: true }).check();
    await expect(page.getByText("36 images", { exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: "Public", exact: true }).uncheck();
    await expect(page.getByText("9 images", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/restriction=private/);
    await page.getByRole("checkbox", { name: "Horizontal", exact: true }).check();
    await expect(page).toHaveURL(/aspect=horizontal/);
    await page.reload();
    await expect(page.getByText("9 images", { exact: true })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Private", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Horizontal", exact: true })).toBeChecked();
});

test("AI toggles return the indicated class of illustrations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("36 images", { exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: "AI", exact: true }).check();
    await expect(page.getByText("12 images", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/aiMode=ai-only/);
    await page.getByRole("checkbox", { name: "AI", exact: true }).uncheck();
    await expect(page.getByText("36 images", { exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: "Non-AI", exact: true }).check();
    await expect(page.getByText("24 images", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/aiMode=non-ai-only/);
});

test("minimum size and page bounds compose and clear", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("36 images", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Width", exact: true }).click();
    await page.getByRole("textbox").first().fill("1920");
    await expect(page.getByText("18 images", { exact: true })).toBeVisible();
    await page.getByRole("spinbutton", { name: "Min", exact: true }).fill("2");
    await page.getByRole("spinbutton", { name: "Max", exact: true }).fill("3");
    await expect(page.getByText("3 images", { exact: true })).toBeVisible();
    await page.getByRole("spinbutton", { name: "Min", exact: true }).fill("");
    await page.getByRole("spinbutton", { name: "Max", exact: true }).fill("");
    await expect(page.getByText("18 images", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Height", exact: true }).click();
    await page.getByRole("textbox").first().fill("1600");
    await expect(page.getByText("18 images", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/sizerMode=height/);
});

test("top tags and Japanese/English autocomplete add, exclude, and clear filters", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("36 images", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /猫.*Cat/ }).click();
    await expect(page.getByText("18 images", { exact: true })).toBeVisible();
    await page.getByRole("combobox").nth(1).fill("R-18");
    await page.getByRole("option", { name: /R-18/ }).click();
    await page.getByRole("combobox").nth(1).press("Escape");
    await expect(page.getByText("15 images", { exact: true })).toBeVisible();
    await page.getByRole("combobox").first().press("Backspace");
    await expect(page.getByText("31 images", { exact: true })).toBeVisible();
    await page.getByRole("combobox").first().fill("Landscape");
    await page.getByRole("option", { name: /風景.*Landscape/ }).click();
    await page.getByRole("combobox").first().press("Escape");
    await expect(page.getByText("16 images", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("16 images", { exact: true })).toBeVisible();
});

test("pagination retains filters and browser history restores the previous page", async ({ page }) => {
    await page.goto("/?blur=true");
    await expect(page.getByText("36 images", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "2", exact: true }).first().click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByAltText("Fixture illustration 1", { exact: true })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "SFW mode", exact: true })).toBeChecked();
    await page.goBack();
    await expect(page).not.toHaveURL(/page=2/);
    await expect(page.getByAltText("Fixture illustration 36", { exact: true })).toBeVisible();
});

test("SFW mode blurs private and R-18 illustrations and can be disabled", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("36 images", { exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: "SFW mode", exact: true }).check();
    await expect(page.getByAltText("Fixture illustration 36", { exact: true }).locator("..")).toHaveClass(/blur-xl/);
    await expect(page.getByAltText("Fixture illustration 35", { exact: true }).locator("..")).toHaveClass(/blur-xl/);
    await expect(page.getByAltText("Fixture illustration 34", { exact: true }).locator("..")).not.toHaveClass(
        /blur-xl/,
    );
    await page.getByRole("checkbox", { name: "SFW mode", exact: true }).uncheck();
    await expect(page.getByAltText("Fixture illustration 36", { exact: true }).locator("..")).not.toHaveClass(
        /blur-xl/,
    );
});

test("hover switches ugoira to the animation proxy; multi-page stacks remain visible", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Hover is a desktop interaction");
    await page.goto("/");
    await expect(page.getByText("36 images", { exact: true })).toBeVisible();
    const image = page.getByAltText("Fixture illustration 36", { exact: true });
    await expect(image).toHaveAttribute("src", /pixivProxy/);
    await image.hover();
    await expect(image).toHaveAttribute("src", /ugoiraProxy/);
    await page.getByText("Search filters", { exact: true }).hover();
    await expect(image).toHaveAttribute("src", /pixivProxy/);
    await expect(page.getByAltText("Fixture illustration 30", { exact: true })).toHaveCount(3);
});

test("a saved Japanese multi-tag URL restores all filters and empty results", async ({ page }) => {
    const params = new URLSearchParams({
        includes: JSON.stringify(["猫", "共通"]),
        excludes: JSON.stringify(["R-18"]),
        restriction: "public",
        aspect: "vertical",
        aiMode: "non-ai-only",
        blur: "true",
        minPages: "1",
        maxPages: "3",
        sizerMode: "height",
        sizerSize: "1600",
    });
    await page.goto(`/?${params}`);
    await expect(page.getByText("10 images", { exact: true })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Vertical", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Non-AI", exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "SFW mode", exact: true })).toBeChecked();
    await page.goto(`/?includes=${encodeURIComponent(JSON.stringify(["missing-tag"]))}`);
    await expect(page.getByText("0 images", { exact: true })).toBeVisible();
    await expect(page.locator("main img")).toHaveCount(0);
});

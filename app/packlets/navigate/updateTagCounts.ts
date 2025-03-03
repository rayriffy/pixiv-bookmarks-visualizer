import type { TagItem } from "$types/TagItem";

// Utility function to update tag counts based on top tags data
export function updateTagCounts(
    existingTags: TagItem[],
    topTags: {
        name: { original: string; translated: string | null };
        count: number;
    }[],
): TagItem[] {
    // Create a map of tag counts from top tags for quick lookup
    const tagCountMap = new Map<string, { count: number; translated: string | null }>();

    for (const tag of topTags) {
        tagCountMap.set(tag.name.original, {
            count: tag.count,
            translated: tag.name.translated,
        });
    }

    // Update existing tags with new counts if available
    return existingTags.map((tag) => {
        // Match tag by name - tag.name should match original name from topTags
        const updatedInfo = tagCountMap.get(tag.name);
        if (updatedInfo) {
            // Create a new object to ensure React detects the change
            return {
                ...tag,
                count: updatedInfo.count,
                // Always update with the most recent translation data from topTags
                translated: updatedInfo.translated,
            };
        }
        return tag;
    });
}

import { updateTagCounts } from "$navigate/updateTagCounts";
import type { TagItem } from "$types/TagItem";
import { useEffect, useRef } from "react";
import { TagSelector } from "./TagSelector";
import { useSearchParams } from "./useSearchParams";
import { useTagSearch } from "./useTagSearch";

export const IncludeTags = () => {
    const { includeTags, excludeTags, setIncludeTags } = useSearchParams();
    const isUpdating = useRef(false);

    // Use the custom hook for tag search, passing both include and exclude tags
    // so we don't suggest tags that are already selected in either category
    const loadOptions = useTagSearch(includeTags, [...includeTags, ...excludeTags]);

    // Use a ref to store the previous tags for comparison
    const prevTagsRef = useRef<string>("");

    // Fetch top tags to get updated counts and translations
    useEffect(() => {
        // Only run if we have tags to update
        if (includeTags.length === 0) return;

        // Create a string representation of tag names only for comparison
        const currentTagsString = JSON.stringify(includeTags.map((tag) => tag.name));

        // Skip if the tag names haven't changed (prevents infinite loop)
        if (currentTagsString === prevTagsRef.current) return;

        // Update the reference for next time
        prevTagsRef.current = currentTagsString;

        const fetchTopTags = async () => {
            try {
                const response = await fetch("/api/topTags");
                const data = await response.json();

                if (data.tags && Array.isArray(data.tags)) {
                    // Use the updateTagCounts utility to refresh tag metadata
                    const updatedTags = updateTagCounts(includeTags, data.tags);

                    // Only update if there are actual changes in translations or counts
                    const hasChanges = updatedTags.some((tag, index) => {
                        return (
                            tag.translated !== includeTags[index].translated || tag.count !== includeTags[index].count
                        );
                    });

                    if (hasChanges && !isUpdating.current) {
                        isUpdating.current = true;
                        try {
                            setIncludeTags(updatedTags);
                        } finally {
                            setTimeout(() => {
                                isUpdating.current = false;
                            }, 100);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching top tags:", error);
            }
        };

        fetchTopTags();
    }, [includeTags, setIncludeTags]);

    // Wrapper for setIncludeTags to ensure clean updates
    const handleTagsChange = (newTags: TagItem[]) => {
        if (isUpdating.current) return;

        isUpdating.current = true;

        try {
            // Ensure we're calling with a properly defined array, even if empty
            setIncludeTags(newTags || []);
        } finally {
            // Reset after a delay
            setTimeout(() => {
                isUpdating.current = false;
            }, 100);
        }
    };

    return (
        <TagSelector label="Include tags" tags={includeTags} loadOptions={loadOptions} onChange={handleTagsChange} />
    );
};

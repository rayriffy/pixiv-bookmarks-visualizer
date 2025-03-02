import { buildURLParams } from "./buildURLParams";
import { TagSearchItem } from "./TagSearchItem";
import { useSearchParams } from "./useSearchParams";

import type { ReactElement } from "react";
import type { TagSearchRequest } from "$types/TagSearchRequest";
import type { TagSearchResponse } from "$types/TagSearchResponse";
import type { TagItem } from "$types/TagItem";

export const useTagSearch = (selectedTags: TagItem[], alreadySelectedTags?: TagItem[]) => {
    const { includeTags, excludeTags } = useSearchParams();

    return async (
        inputValue: string,
    ): Promise<
        {
            value: TagItem;
            label: ReactElement;
        }[]
    > => {
        try {
            // If alreadySelectedTags wasn't provided, default to combining both include and exclude tags
            const allSelectedTags = alreadySelectedTags || [...includeTags, ...excludeTags];

            const tagSearchPayload: TagSearchRequest = {
                query: inputValue,
                selectedTags: selectedTags.map((t) => t.name), // Selected tags for the search context
                alreadySelectedTags: allSelectedTags.map((t) => t.name), // Tags to exclude from results
            };

            const expectedResults: TagSearchResponse = await fetch(
                `/api/tagSearch?${buildURLParams(tagSearchPayload as unknown as Record<string, string | string[]>)}`,
            ).then((o) => o.json());

            return expectedResults.tags.map((tag) => ({
                value: {
                    name: tag.name.original,
                    translated: tag.name.translated,
                    count: tag.count,
                } as TagItem,
                label: <TagSearchItem {...tag} />,
            }));
        } catch (e) {
            console.error(e);
            return [];
        }
    };
};

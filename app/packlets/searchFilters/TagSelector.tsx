import { updateTagCounts } from "$navigate/updateTagCounts";
import type { TagItem } from "$types/TagItem";
import type { TagSearchResponse } from "$types/TagSearchResponse";
import { type Dispatch, type ReactElement, type SetStateAction, useEffect, useMemo, useState } from "react";
import Async from "react-select/async";
import useSWR from "swr";
import { TagSearchItem } from "./TagSearchItem";

interface TagSelectorProps {
    label: string;
    tags: TagItem[];
    loadOptions: (inputValue: string) => Promise<{ value: TagItem; label: ReactElement }[]>;
    onChange: Dispatch<SetStateAction<TagItem[]>>;
}

export const TagSelector = ({ label, tags, loadOptions, onChange }: TagSelectorProps) => {
    const [loading, setLoading] = useState(false);
    const { data } = useSWR<TagSearchResponse>("/api/topTags");
    const inputId = label === "Include tags" ? "include-tags" : "exclude-tags";

    // Refresh metadata against the current selection; an old response cannot restore removed tags.
    useEffect(() => {
        if (data?.tags) onChange((previous) => updateTagCounts(previous, data.tags));
    }, [data, onChange]);

    const selectValue = useMemo(
        () =>
            tags.map((tag) => ({
                value: tag,
                label: (
                    <TagSearchItem
                        name={{ original: tag.name, translated: tag.translated || null }}
                        count={tag.count || 0}
                    />
                ),
            })),
        [tags],
    );

    const handleLoadOptions = async (inputValue: string) => {
        try {
            setLoading(true);
            return await loadOptions(inputValue);
        } finally {
            setLoading(false);
        }
    };

    return (
        <fieldset className="fieldset">
            <label className="fieldset-label" htmlFor={inputId}>
                {label}
            </label>
            <Async
                inputId={inputId}
                instanceId={inputId}
                isMulti
                value={selectValue}
                loadOptions={handleLoadOptions}
                isLoading={loading}
                onChange={(newValue) => onChange(newValue.map((option) => option.value).filter((tag) => tag.name))}
                getOptionValue={(option) => option.value.name}
                getOptionLabel={(option) => [option.value.name, option.value.translated].filter(Boolean).join(" ")}
                formatOptionLabel={(option) => option.label}
                isClearable={true}
                styles={{ menu: (provided) => ({ ...provided, zIndex: 10 }) }}
                closeMenuOnSelect={false}
                cacheOptions={false}
                defaultOptions={[]}
            />
        </fieldset>
    );
};

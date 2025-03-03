import type { TagItem } from "$types/TagItem";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import Async from "react-select/async";
import { TagSearchItem } from "./TagSearchItem";

interface TagSelectorProps {
    label: string;
    tags: TagItem[];
    loadOptions: (inputValue: string) => Promise<
        {
            value: TagItem;
            label: ReactElement;
        }[]
    >;
    onChange: (tags: TagItem[]) => void;
}

export const TagSelector = ({ label, tags, loadOptions, onChange }: TagSelectorProps) => {
    const [loading, setLoading] = useState(false);
    const isHandlingChange = useRef(false);
    const [selectValue, setSelectValue] = useState<
        {
            value: TagItem;
            label: ReactElement;
        }[]
    >([]);

    // Update the select value whenever tags change
    useEffect(() => {
        const newSelectValue = tags.map((tag) => ({
            value: tag,
            label: (
                <TagSearchItem
                    name={{
                        original: tag.name,
                        translated: tag.translated || null,
                    }}
                    count={tag.count || 0}
                />
            ),
        }));
        setSelectValue(newSelectValue);
    }, [tags]);

    const handleLoadOptions = async (inputValue: string) => {
        try {
            setLoading(true);
            return await loadOptions(inputValue);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        newValue: readonly {
            value: TagItem;
            label: ReactElement;
        }[],
    ) => {
        // Avoid processing if we're already handling a change
        if (isHandlingChange.current) return;

        isHandlingChange.current = true;

        try {
            // Extract the tag values and ensure they're valid
            const newTags = Array.isArray(newValue)
                ? newValue.map((o) => o.value as TagItem).filter((tag) => tag && tag.name)
                : [];

            // Explicitly call with empty array if all tags were removed
            onChange(newTags);
        } finally {
            // Reset the flag after a delay to allow state to update
            setTimeout(() => {
                isHandlingChange.current = false;
            }, 100);
        }
    };

    return (
        <fieldset className="fieldset">
            <label className="fieldset-label">{label}</label>
            <Async
                isMulti
                value={selectValue}
                loadOptions={handleLoadOptions}
                isLoading={loading}
                onChange={handleChange}
                isClearable={true}
                styles={{
                    menu: (provided) => ({
                        ...provided,
                        zIndex: 10,
                    }),
                }}
                // Force sync updates for multi-select when clearing
                closeMenuOnSelect={false}
                cacheOptions={false}
                defaultOptions={[]}
            />
        </fieldset>
    );
};

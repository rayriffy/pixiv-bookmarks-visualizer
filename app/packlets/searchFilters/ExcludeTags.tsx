import { TagSelector } from "./TagSelector";
import { useSearchParams } from "./useSearchParams";
import { useTagSearch } from "./useTagSearch";

export const ExcludeTags = () => {
    const { includeTags, excludeTags, setExcludeTags } = useSearchParams();
    const loadOptions = useTagSearch(excludeTags, [...includeTags, ...excludeTags]);
    return <TagSelector label="Exclude tags" tags={excludeTags} loadOptions={loadOptions} onChange={setExcludeTags} />;
};

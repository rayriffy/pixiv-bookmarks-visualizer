import { TagSelector } from "./TagSelector";
import { useSearchParams } from "./useSearchParams";
import { useTagSearch } from "./useTagSearch";

export const IncludeTags = () => {
    const { includeTags, excludeTags, setIncludeTags } = useSearchParams();
    const loadOptions = useTagSearch(includeTags, [...includeTags, ...excludeTags]);
    return <TagSelector label="Include tags" tags={includeTags} loadOptions={loadOptions} onChange={setIncludeTags} />;
};

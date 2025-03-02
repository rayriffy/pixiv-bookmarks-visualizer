import { BookmarkType } from "./BookmarkType";
import { IncludeTags } from "./IncludeTags";
import { ExcludeTags } from "./ExcludeTags";
import { Aspect } from "./Aspect";
import { Size } from "./Size";
import { PageCount } from "./PageCount";
import { AI } from "./AI";
import { SafeForWork } from "./SafeForWork";

export const SearchFilters = () => {
    return (
        <fieldset className="fieldset bg-base-100 border border-base-300 p-4 rounded-box md:col-span-1 lg:col-span-3">
            <legend className="fieldset-legend">Search filters</legend>

            <div className="grid lg:grid-cols-5 -mt-3 gap-4">
                <fieldset className="fieldset">
                    <BookmarkType />
                    <Aspect />
                </fieldset>
                <fieldset className="fieldset">
                    <AI />
                    <SafeForWork />
                </fieldset>
                <fieldset className="fieldset col-span-3">
                    <Size />
                    <PageCount />
                </fieldset>
            </div>

            <IncludeTags />
            <ExcludeTags />
        </fieldset>
    );
};

import { memo } from "react";
import type { Tag } from "$types/Tag";

export const TagSearchItem = memo<Tag>(({ name, count }) => (
    <p className="flex items-center">
        <span className="font-medium">{name.original}</span>
        <span className="ml-2 text-gray-500 text-sm">{name.translated}</span>
        <span className="text-xs text-white bg-gray-900 py-0.5 px-2 rounded-md ml-2">{count}</span>
    </p>
));

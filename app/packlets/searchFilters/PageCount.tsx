import { type ChangeEventHandler, useCallback, useRef } from "react";
import { useSearchParams } from "./useSearchParams";

export const PageCount = () => {
    const { minimumPageCount, setMinimumPageCount, maximumPageCount, setMaximumPageCount } = useSearchParams();

    const isHandlingMinChange = useRef(false);
    const isHandlingMaxChange = useRef(false);

    const onMinimumValueChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
        ({ target: { value } }) => {
            isHandlingMinChange.current = true;

            // Handle empty string explicitly to allow clearing the input
            const newValue = value === "" ? "0" : value;
            setMinimumPageCount(newValue);

            // Reset the flag after a small delay
            setTimeout(() => {
                isHandlingMinChange.current = false;
            }, 50);
        },
        [setMinimumPageCount],
    );

    const onMaximumValueChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
        ({ target: { value } }) => {
            isHandlingMaxChange.current = true;

            // Handle empty string explicitly to allow clearing the input
            const newValue = value === "" ? "0" : value;
            setMaximumPageCount(newValue);

            // Reset the flag after a small delay
            setTimeout(() => {
                isHandlingMaxChange.current = false;
            }, 50);
        },
        [setMaximumPageCount],
    );

    return (
        <>
            <label className="fieldset-label">Multi-page illust</label>
            <div className="grid grid-cols-2 gap-4">
                <label className="input input-sm">
                    Min
                    <input
                        type="number"
                        min="0"
                        step="1"
                        className="grow"
                        value={minimumPageCount === "0" ? "" : minimumPageCount}
                        placeholder="0"
                        onChange={onMinimumValueChange}
                    />
                </label>
                <label className="input input-sm">
                    Max
                    <input
                        type="number"
                        min="0"
                        step="1"
                        className="grow"
                        value={maximumPageCount === "0" ? "" : maximumPageCount}
                        placeholder="0"
                        onChange={onMaximumValueChange}
                    />
                </label>
            </div>
        </>
    );
};

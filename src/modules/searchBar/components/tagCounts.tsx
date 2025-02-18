import React, { memo, useEffect, useState } from 'react';
import { TagSearchResponse, Tag } from '../../../core/@types/api/TagSearchResponse';

export const TagCount = memo(() => {
    const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    useEffect(() => {
        const fetchTags = async () => {
            try {
                setLoading(true)

                const expectedResults: TagSearchResponse = await fetch(
                    `/api/tagSearch?`
                ).then(o => o.json())

                let sortedTags = expectedResults.tags.sort((a, b) => b.count - a.count)
                setTags(
                    sortedTags.length <= 15 ? sortedTags : sortedTags.slice(0, 15)
                )
            } catch (e) {
                console.error(e)
                setTags([])
                setError(e.message)
            } finally {
                setLoading(false)
            }
        };

        fetchTags();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }


    return (
        <span className="isolate inline-flex rounded-md shadow-sm">
            <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', maxWidth: '500px', margin: '0 auto' }}>
                <label htmlFor="tagsLabel" className="font-medium text-gray-900">
                    Top 10 tags:
                </label>
                <button onClick={toggleCollapse} style={{ marginBottom: '10px', padding: '5px 10px', cursor: 'pointer' }}>
                    {isCollapsed ? 'Expand' : 'Collapse'}
                </button>
                <div
                    style={{
                        maxHeight: isCollapsed ? '0' : '500px', // Adjust max height for smooth transition
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease-in-out', // Smooth transition
                    }}
                >
                    {tags.map((tag, index) => (
                        <span className="rounded-l-md rounded-r-md border border-gray-300"
                            key={index}
                            style={{
                                fontSize: `14px`, // Set font size based on word count
                                margin: '5px',
                                display: 'inline-block',
                                transition: 'font-size 0.2s ease-in-out', // Smooth font size transition
                                padding: '5px',
                            }}
                        >
                            {tag.name.translated ?? tag.name.original}
                        </span>
                    ))}
                </div>
            </div>
        </span>
    );
});

export default TagCount;

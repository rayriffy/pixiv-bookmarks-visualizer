// Define a TagItem interface for storing both the name and metadata
export interface TagItem {
    id?: string;
    name: string;
    translated?: string | null;
    count?: number;
}

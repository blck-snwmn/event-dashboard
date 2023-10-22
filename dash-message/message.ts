export interface Product {
    id: number;
    title: string;
    handle: string;
    vendor: string;
    tags: string[];
}

export interface Limit {
    startDate: Date | null;
    endDate: Date | null;
}

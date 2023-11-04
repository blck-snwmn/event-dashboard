export interface Product {
    id: number;
    title: string;
    handle: string;
    vendor: string;
    tags: string[];
}

export interface Tag {
    name: string;
}

export interface TagGroup {
    name: string;
    tags: Tag[];
}

export interface Limit {
    startDate: string | null;
    endDate: string | null;
}

export type Itemliimit = {
    id: number;
} & Limit;

export type ProductWithLimit = Product & Limit;

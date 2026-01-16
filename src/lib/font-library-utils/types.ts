export interface FontFace
{
    fontFamily: string;
    fontStyle: string;
    fontWeight: string;
    src?: string | string[];
    file?: File;
    [key: string]: any; // For additional props like ascentOverride, etc.
}

export interface FontFamily
{
    name: string;
    slug: string;
    fontFamily: string;
    fontFace?: FontFace[];
    categories: string[];
    collectionSlug?: string;
    [key: string]: any; // For additional settings
}

export interface FontCollection
{
    slug: string;
    name: string;
    description: string;
    font_families: FontFamily[];
    categories: { slug: string; name: string }[];
}
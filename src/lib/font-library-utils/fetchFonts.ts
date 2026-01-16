import apiFetch from "@wordpress/api-fetch";
import type { FontFamily, FontCollection } from "./types";

const FONT_COLLECTIONS_URL = '/wp/v2/font-collections';

/**
 * Fetches all registered font collections
 */
async function fetchFontCollections(): Promise<FontCollection[]>
{
    return apiFetch({ path: FONT_COLLECTIONS_URL, method: 'GET' });
}

/**
 * Fetches details for a single font collection by slug
 */
async function fetchFontCollection(slug: string): Promise<FontCollection>
{
    return apiFetch({ path: `${FONT_COLLECTIONS_URL}/${slug}`, method: 'GET' });
}

/**
 * Fetches all available fonts from all registered font collections.
 * Aggregates font_families from each collection and adds collectionSlug for reference.
 */
export async function fetchAllAvailableFonts(): Promise<FontFamily[]>
{
    const collections = await fetchFontCollections();
    const allFonts: FontFamily[] = [];

    for (const collection of collections) {
        try {
            const detailedCollection = await fetchFontCollection(collection.slug);
            if (detailedCollection.font_families) {
                const fontsWithCollection = detailedCollection.font_families.map((font) => ({
                    ...font,
                    collectionSlug: collection.slug,
                }));
                allFonts.push(...fontsWithCollection);
            }
        }
        catch (error) {
            console.error(`Failed to fetch fonts from collection ${collection.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            continue;
        }
    }

    return allFonts;
}
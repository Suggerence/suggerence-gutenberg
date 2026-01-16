import apiFetch from "@wordpress/api-fetch";
import type { FontFamily } from "./types";

const FONT_FAMILIES_URL = '/wp/v2/font-families';

/**
 * Fetches a font family by slug from installed fonts.
 * Returns the FontFamily if installed, or null if not found.
 */
export async function fetchGetFontFamilyBySlug(slug: string): Promise<FontFamily | null> {
    const response = await apiFetch({
        path: `${FONT_FAMILIES_URL}?slug=${slug}&_embed=true`,
        method: 'GET',
    });
    if (!response || !Array.isArray(response) || response.length === 0) {
        return null;
    }
    const fontFamilyPost = response[0];
    return {
        id: fontFamilyPost.id,
        ...fontFamilyPost.font_family_settings,
        fontFace: fontFamilyPost?._embedded?.font_faces.map((face: any) => face.font_face_settings) || [],
    };
}

/**
 * Checks if a font is installed by slug.
 * Returns true if the font family exists (with any font faces), false otherwise.
 */
export async function isFontInstalled(slug: string): Promise<boolean> {
    const fontFamily = await fetchGetFontFamilyBySlug(slug);
    return !!fontFamily;
}
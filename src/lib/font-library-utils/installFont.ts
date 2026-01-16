import apiFetch from "@wordpress/api-fetch";
import { dispatch } from "@wordpress/data";
import type { FontFamily, FontFace } from "./types";
import { fetchGetFontFamilyBySlug } from "./isFontInstalled";
import { THEME_EDITOR_API_NAMESPACE } from "../../apps/theme-editor/constants/api";
import { getUserConfiguredStyles, WPCore } from "@/apps/theme-editor/tools/handlers/listStyles";
import type { GlobalStylesConfig } from "../global-styles-engine/types";

const FONT_FAMILIES_URL = '/wp/v2/font-families';

export const WPCoreDispatch = () => {
    return dispatch('core');
}

/**
 * Downloads a font face asset from a remote URL and uploads it to the child theme's assets folder.
 * Returns the URL of the saved font file.
 * Handles single string src; extend for array if needed.
 */
async function downloadFontFaceAsset(src: string, fontSlug: string): Promise<string>
{
    // Download the font file
    const response = await fetch(src);
    if (!response.ok) {
        throw new Error(`Failed to download font asset from ${src}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const extension = blob.type.split('/')[1] || 'woff2';
    const filename = `${fontSlug}.${extension}`;

    // Upload to backend endpoint
    const formData = new FormData();
    formData.append('file', blob, filename);

    try {
        const uploadResult = await apiFetch<{ success: boolean; path: string; url: string }>({
            path: `${THEME_EDITOR_API_NAMESPACE}/fonts/upload`,
            method: 'POST',
            body: formData,
        });

        if (!uploadResult.success || !uploadResult.url) {
            throw new Error('Failed to upload font asset to child theme');
        }

        return uploadResult.url;
    } catch (error) {
        // Fallback: try binary upload if FormData doesn't work
        const arrayBuffer = await blob.arrayBuffer();
        const uploadResult = await apiFetch<{ success: boolean; path: string; url: string }>({
            path: `${THEME_EDITOR_API_NAMESPACE}/fonts/upload`,
            method: 'POST',
            body: arrayBuffer,
            headers: {
                'Content-Type': blob.type,
                'X-Font-Filename': filename,
            },
        });

        if (!uploadResult.success || !uploadResult.url) {
            throw new Error('Failed to upload font asset to child theme');
        }

        return uploadResult.url;
    }
}

/**
 * Prepares FormData for a font family.
 * Adapted from Gutenberg's makeFontFamilyFormData.
 */
function makeFontFamilyFormData(fontFamily: FontFamily): FormData
{
    const formData = new FormData();
    formData.append('name', fontFamily.font_family_settings.name);
    formData.append('slug', fontFamily.font_family_settings.slug);
    formData.append('font_family_settings', JSON.stringify({
        ...fontFamily.font_family_settings,
        fontFace: undefined
    }));
    return formData;
}

/**
 * Prepares FormData for font faces.
 * Adapted from Gutenberg's makeFontFacesFormData; handles multiple faces.
 */
function makeFontFacesFormData(fontFaces: FontFace[]): FormData
{
    const formData = new FormData();
    fontFaces.forEach((face, index) => {
        if (face.file) {
            formData.append(`file-${index}`, face.file);
        }
        formData.append(`font_face_settings-${index}`, JSON.stringify(face));
    });
    return formData;
}

/**
 * Installs a single font face for a font family.
 */
async function fetchInstallFontFace(fontFamilyId: string | number, data: FormData): Promise<FontFace>
{
    return apiFetch({
        path: `${FONT_FAMILIES_URL}/${fontFamilyId}/font-faces`,
        method: 'POST',
        body: data,
    });
}

/**
 * Installs a font family from a collection.
 * - Downloads remote assets if needed.
 * - Creates/updates font family post.
 * - Installs font faces (batched in loop for simplicity)
 * - Does NOT handle activation (adding to global styles); do that separately with @wordpress/data.
 * @param fontFamily The font family to install.
 * @param fontFaces Optional subset of font faces to install (defaults to all in fontFamily.fontFace).
 */
export async function installFont(fontFamily: FontFamily, fontFaces: FontFace[] = fontFamily.font_family_settings.fontFace || []): Promise<FontFamily>
{
    // Download remote assets and store them in child theme
    for (const face of fontFaces) {
        if (typeof face.src === 'string' && face.src.startsWith('http')) {
            // Download and save to child theme assets folder
            const fontUrl = await downloadFontFaceAsset(face.src, fontFamily.font_family_settings.slug);
            // Update src to point to the saved font file
            face.src = fontUrl;
            delete face.file; // Remove file property if it exists
        }
        else if (Array.isArray(face.src)) {
            // Handle first valid remote src; extend as needed
            const remoteSrc = face.src.find((s) => typeof s === 'string' && s.startsWith('http'));
            if (remoteSrc) {
                // Download and save to child theme assets folder
                const fontUrl = await downloadFontFaceAsset(remoteSrc, fontFamily.font_family_settings.slug);
                // Update src array to use the saved font file
                face.src = [fontUrl];
                delete face.file; // Remove file property if it exists
            }
        }
    }

    // Get or create font family
    let installedFamily = await fetchGetFontFamilyBySlug(fontFamily.font_family_settings.slug);
    if (!installedFamily) {
        const formData = makeFontFamilyFormData(fontFamily);
        installedFamily = await apiFetch({
            path: FONT_FAMILIES_URL,
            method: 'POST',
            body: formData,
        });
    }

    // Install font faces (batch via loop; for true batch, adjust endpoint if supported)
    const installedFaces: FontFace[] = [];
    for (const face of fontFaces) {
        try {
            const faceFormData = makeFontFacesFormData([face]);
            const installedFace = await fetchInstallFontFace(installedFamily?.id, faceFormData);
            installedFaces.push(installedFace);
        }
        catch (error) {
            console.error(`Failed to install font face: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Update global styles settings
    const userConfiguredStyles = getUserConfiguredStyles() as GlobalStylesConfig | null | undefined;

    // Transform installed font data into global styles format
    const fontName = installedFamily?.font_family_settings.name || fontFamily.font_family_settings.name;
    const fontSlug = installedFamily?.font_family_settings.slug || fontFamily.font_family_settings.slug;
    const fontFamilyValue = installedFamily?.font_family_settings.fontFamily || fontFamily.font_family_settings.fontFamily;
    
    // Check if font already exists in theme or custom fonts
    const themeFonts = userConfiguredStyles?.settings?.typography?.fontFamilies?.theme || [];
    const customFonts = userConfiguredStyles?.settings?.typography?.fontFamilies?.custom || [];
    
    const fontExistsInTheme = themeFonts.some((font: any) => font.slug === fontSlug);
    const fontExistsInCustom = customFonts.some((font: any) => font.slug === fontSlug);
    
    // Only add to custom fonts if it doesn't already exist
    let updatedUserConfiguredStyles: GlobalStylesConfig = userConfiguredStyles || { settings: {}, styles: {} };
    
    if (!fontExistsInTheme && !fontExistsInCustom) {
        // Transform font faces to global styles format
        const globalStylesFontFaces = installedFaces.map((face) => ({
            src: face.src,
            fontWeight: face.fontWeight || '400',
            fontStyle: face.fontStyle || 'normal',
            fontFamily: face.fontFamily || fontName,
            ...(face.preview && { preview: face.preview }),
        }));
        
        // Create the custom font entry
        const customFontEntry = {
            name: fontName,
            slug: fontSlug,
            fontFamily: fontFamilyValue,
            ...(fontFamily.font_family_settings.preview && { preview: fontFamily.font_family_settings.preview }),
            fontFace: globalStylesFontFaces,
        };
        
        // Ensure the structure exists and add the custom font
        updatedUserConfiguredStyles = {
            styles: {}, // TODO: Revisit in the future
            settings: {
                ...updatedUserConfiguredStyles.settings,
                typography: {
                    ...updatedUserConfiguredStyles.settings?.typography,
                    fontFamilies: {
                        ...updatedUserConfiguredStyles.settings?.typography?.fontFamilies,
                        custom: [
                            ...customFonts,
                            customFontEntry,
                        ],
                    },
                },
            },
        };

        const globalStylesId = WPCore().__experimentalGetCurrentGlobalStylesId() as string | number;
        const coreDispatch = WPCoreDispatch() as any;
        coreDispatch.editEntityRecord('root', 'globalStyles', globalStylesId, updatedUserConfiguredStyles);
        coreDispatch.saveEditedEntityRecord('root', 'globalStyles', globalStylesId);
    }    

    return {
        ...installedFamily,
        name: fontName,
        slug: fontSlug,
        fontFamily: fontFamilyValue,
        categories: installedFamily?.font_family_settings.categories || fontFamily.font_family_settings.categories,
        fontFace: [...(installedFamily?.font_family_settings.fontFace || []), ...installedFaces],
    }
}
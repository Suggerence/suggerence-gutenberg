import { fetchAllAvailableFonts, installFont } from "@/lib/font-library-utils";

export default async (data: { slug: string }) => {
    const { slug } = data;

    const allFonts = await fetchAllAvailableFonts();
    const targetFont = allFonts.find((font) => font.font_family_settings.slug === slug);

    if (!targetFont) {
        return {
            success: false,
            message: 'Font family not found'
        }
    }

    await installFont(targetFont);
    
    return {
        success: true,
        message: 'Font family installed successfully'
    }
}
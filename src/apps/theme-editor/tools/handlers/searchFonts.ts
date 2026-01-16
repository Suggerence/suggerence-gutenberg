import Fuse from 'fuse.js';
import { fetchAllAvailableFonts, isFontInstalled } from "@/lib/font-library-utils";

export default async (data: { query: string }) => {
    const { query } = data;

    const availableFonts = await fetchAllAvailableFonts();

    const fuse = new Fuse(availableFonts, {keys: ['font_family_settings.name', 'font_family_settings.fontFamily', 'font_family_settings.slug'], threshold: 0.3});
    const results = fuse.search(query);

    return await Promise.all(results.map(async (result) => ({
        name: result.item.font_family_settings.name,
        slug: result.item.font_family_settings.slug,
        fontFamily: result.item.font_family_settings.fontFamily,
        installed: await isFontInstalled(result.item.font_family_settings.slug),
    })));
};
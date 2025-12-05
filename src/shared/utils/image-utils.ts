/**
 * Converts an image URL to base64 format
 * @param url - The image URL to convert
 * @returns Promise with base64 data and media type
 */
export async function convertImageUrlToBase64(url: string): Promise<{ data: string; media_type: string }> {
    try {
        // Fetch the image
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        // Get the blob
        const blob = await response.blob();
        
        // Get the MIME type
        const media_type = blob.type || 'image/png';

        // Convert blob to base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Remove the data URL prefix (e.g., "data:image/png;base64,")
                const base64Data = base64String.split(',')[1];
                resolve({ data: base64Data, media_type });
            };
            reader.onerror = () => {
                reject(new Error('Failed to convert image to base64'));
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting image URL to base64:', error);
        throw error;
    }
}


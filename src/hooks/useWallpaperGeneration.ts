import { useState, useRef, useCallback } from 'react';
import { WallpaperFormat, WallpaperResult, FORMATS, ZIMA_BLUE } from '../types/wallpaper';

export const useWallpaperGeneration = () => {
    const [wallpapers, setWallpapers] = useState<string[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [imageLoadErrors, setImageLoadErrors] = useState<boolean[]>([]);

    const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
    const previewCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

    const loadImageAsBlob = useCallback(async (imageUrl: string): Promise<HTMLImageElement> => {
        try {
            // Fetch the image through our proxy API or directly
            let fetchUrl: string;
            if (imageUrl.includes('unsplash.com')) {
                fetchUrl = imageUrl;
            } else {
                // Use proxy for NASA and other external images
                fetchUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
            }

            const response = await fetch(fetchUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(objectUrl); // Clean up
                    resolve(img);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl); // Clean up
                    reject(new Error('Failed to load image from blob'));
                };
                img.src = objectUrl;
            });
        } catch (error) {
            // Fallback to a reliable Unsplash image
            console.warn('Primary image failed, using fallback:', error);
            const fallbackUrl = `https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=3840&h=2160&fit=crop&auto=format`;

            const response = await fetch(fallbackUrl);
            if (!response.ok) {
                throw new Error('Fallback image also failed to load');
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);
                    resolve(img);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error('Fallback image failed to load from blob'));
                };
                img.src = objectUrl;
            });
        }
    }, []);

    const generatePreviewImage = useCallback(async (
        index: number,
        img: HTMLImageElement,
        format: WallpaperFormat
    ): Promise<string> => {
        const canvas = previewCanvasRefs.current[index];
        if (!canvas) throw new Error('Canvas not found');

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not found');

        // Use smaller dimensions for preview with correct aspect ratios
        const previewDimensions = format === '4k-desktop'
            ? { width: 800, height: 450 }  // 16:9 ratio
            : { width: 400, height: 711 }; // 9:16 ratio (400 * 16/9 = 711.11)

        canvas.width = previewDimensions.width;
        canvas.height = previewDimensions.height;

        // Clear the canvas first
        ctx.clearRect(0, 0, previewDimensions.width, previewDimensions.height);

        // Draw the space background, scaling to fill the canvas
        const scale = Math.max(previewDimensions.width / img.width, previewDimensions.height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (previewDimensions.width - scaledWidth) / 2;
        const y = (previewDimensions.height - scaledHeight) / 2;

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        // Calculate rectangle dimensions (proportional to preview size) - increased randomness
        const rectWidth = Math.floor(previewDimensions.width * (0.05 + Math.random() * 0.10));
        const rectHeight = Math.floor(previewDimensions.height * (0.05 + Math.random() * 0.10));

        // Center the rectangle in the middle of the image
        const rectX = Math.floor((previewDimensions.width - rectWidth) / 2);
        const rectY = Math.floor((previewDimensions.height - rectHeight) / 2);

        // Draw the Zima Blue rectangle
        ctx.fillStyle = ZIMA_BLUE;
        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

        // Convert to data URL with good compression for preview
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        console.log(`Preview data URL for index ${index}:`, dataUrl.substring(0, 50) + '...');

        // Validate the data URL
        if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 100) {
            throw new Error(`Invalid preview data URL generated for index ${index}`);
        }

        return dataUrl;
    }, []);

    const generateWallpaper = useCallback(async (
        index: number,
        format: WallpaperFormat,
        spaceImageSources: string[]
    ): Promise<WallpaperResult> => {
        const canvas = canvasRefs.current[index];
        if (!canvas) throw new Error('Canvas not found');

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not found');

        const dimensions = FORMATS[format];
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        try {
            // Get a random space image
            const randomImageUrl = spaceImageSources[Math.floor(Math.random() * spaceImageSources.length)];
            console.log('Loading image:', randomImageUrl);

            // Load the space image as blob to avoid CORS issues
            const img = await loadImageAsBlob(randomImageUrl);
            console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);

            // First generate the preview image
            const preview = await generatePreviewImage(index, img, format);
            console.log('Preview generated, length:', preview.length);

            // Now generate full resolution version
            canvas.width = dimensions.width;
            canvas.height = dimensions.height;

            // Draw the space background, scaling to fill the canvas
            const scale = Math.max(dimensions.width / img.width, dimensions.height / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const x = (dimensions.width - scaledWidth) / 2;
            const y = (dimensions.height - scaledHeight) / 2;

            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

            // Calculate rectangle dimensions with increased randomness (5-15% of image size)
            const rectWidth = Math.floor(dimensions.width * (0.05 + Math.random() * 0.10));
            const rectHeight = Math.floor(dimensions.height * (0.05 + Math.random() * 0.10));

            // Center the rectangle in the middle of the image
            const rectX = Math.floor((dimensions.width - rectWidth) / 2);
            const rectY = Math.floor((dimensions.height - rectHeight) / 2);

            // Draw the Zima Blue rectangle
            ctx.fillStyle = ZIMA_BLUE;
            ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

            // Convert to data URL for full resolution download
            const fullRes = canvas.toDataURL('image/png', 1.0);
            console.log('Full resolution wallpaper generated, length:', fullRes.length);

            // Check if data URLs are valid
            if (!fullRes || fullRes === 'data:,' || !preview || preview === 'data:,') {
                throw new Error('Invalid data URL generated');
            }

            return { fullRes, preview };
        } catch (error) {
            console.error('Error generating wallpaper:', error);
            throw new Error(`Failed to generate wallpaper: ${error}`);
        }
    }, [loadImageAsBlob, generatePreviewImage]);

    const generateAllWallpapers = useCallback(async (
        format: WallpaperFormat,
        spaceImageSources: string[]
    ) => {
        setIsGenerating(true);
        try {
            // Small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 500));

            const results = [
                await generateWallpaper(0, format, spaceImageSources),
                await generateWallpaper(1, format, spaceImageSources),
                await generateWallpaper(2, format, spaceImageSources)
            ];

            const newWallpapers = results.map(result => result.fullRes);
            const newPreviews = results.map(result => result.preview);

            console.log('Setting wallpapers, count:', newWallpapers.length);
            console.log('Setting previews, count:', newPreviews.length);
            console.log('First preview length:', newPreviews[0]?.length || 'undefined');

            // Update state with a small delay to ensure proper rendering
            setTimeout(() => {
                setWallpapers(newWallpapers);
                setPreviewImages(newPreviews);
                setImageLoadErrors([false, false, false]); // Reset error states
            }, 100);
        } catch (error) {
            console.error('Error generating wallpapers:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [generateWallpaper]);

    const downloadWallpaper = (dataUrl: string, index: number, format: WallpaperFormat) => {
        const link = document.createElement('a');
        link.download = `zima-blue-wallpaper-${format}-${index + 1}.png`;
        link.href = dataUrl;
        link.click();
    };

    const setImageError = (index: number, hasError: boolean) => {
        setImageLoadErrors(prev => {
            const newErrors = [...prev];
            newErrors[index] = hasError;
            return newErrors;
        });
    };

    return {
        wallpapers,
        previewImages,
        isGenerating,
        imageLoadErrors,
        canvasRefs,
        previewCanvasRefs,
        generateAllWallpapers,
        downloadWallpaper,
        setImageError
    };
};

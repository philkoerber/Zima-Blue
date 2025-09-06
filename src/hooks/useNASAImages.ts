import { useState, useEffect } from 'react';
import { FALLBACK_IMAGES } from '../types/wallpaper';

export const useNASAImages = () => {
    const [spaceImageSources, setSpaceImageSources] = useState<string[]>([]);
    const [isLoadingImages, setIsLoadingImages] = useState(true);

    const fetchNASAImages = async (): Promise<void> => {
        try {
            setIsLoadingImages(true);
            const response = await fetch('/api/nasa-images');
            const data = await response.json();

            if (data.success && data.images.length > 0) {
                setSpaceImageSources(data.images);
                console.log(`Loaded ${data.images.length} NASA images from ${data.source}`);
            } else {
                console.warn('Failed to load NASA images, using fallback');
                setSpaceImageSources(FALLBACK_IMAGES);
            }
        } catch (error) {
            console.error('Error fetching NASA images:', error);
            setSpaceImageSources(FALLBACK_IMAGES);
        } finally {
            setIsLoadingImages(false);
        }
    };

    useEffect(() => {
        fetchNASAImages();
    }, []);

    return {
        spaceImageSources,
        isLoadingImages,
        refetchImages: fetchNASAImages
    };
};

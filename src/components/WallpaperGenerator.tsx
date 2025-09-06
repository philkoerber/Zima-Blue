'use client';

import { useState, useRef, useEffect } from 'react';

type WallpaperFormat = '4k-desktop' | 'phone';

interface WallpaperDimensions {
    width: number;
    height: number;
}

const FORMATS: Record<WallpaperFormat, WallpaperDimensions> = {
    '4k-desktop': { width: 3840, height: 2160 },
    'phone': { width: 1080, height: 1920 }
};

const ZIMA_BLUE = '#5BC2E7';

// Dynamic space image sources - will be populated from NASA API
let SPACE_IMAGE_SOURCES: string[] = [];

export default function WallpaperGenerator() {
    const [format, setFormat] = useState<WallpaperFormat>('4k-desktop');
    const [wallpapers, setWallpapers] = useState<string[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [imageLoadErrors, setImageLoadErrors] = useState<boolean[]>([]);
    const [isLoadingImages, setIsLoadingImages] = useState(true);
    const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
    const previewCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

    const fetchNASAImages = async (): Promise<void> => {
        try {
            setIsLoadingImages(true);
            const response = await fetch('/api/nasa-images');
            const data = await response.json();

            if (data.success && data.images.length > 0) {
                SPACE_IMAGE_SOURCES = data.images;
                console.log(`Loaded ${data.images.length} NASA images from ${data.source}`);
            } else {
                console.warn('Failed to load NASA images, using fallback');
                // Fallback to reliable Unsplash images
                SPACE_IMAGE_SOURCES = [
                    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=3840&h=2160&fit=crop&auto=format',
                    'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=3840&h=2160&fit=crop&auto=format',
                    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=3840&h=2160&fit=crop&auto=format',
                    'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=3840&h=2160&fit=crop&auto=format',
                    'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=3840&h=2160&fit=crop&auto=format'
                ];
            }
        } catch (error) {
            console.error('Error fetching NASA images:', error);
            // Fallback to reliable Unsplash images
            SPACE_IMAGE_SOURCES = [
                'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=3840&h=2160&fit=crop&auto=format',
                'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=3840&h=2160&fit=crop&auto=format',
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=3840&h=2160&fit=crop&auto=format',
                'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=3840&h=2160&fit=crop&auto=format',
                'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=3840&h=2160&fit=crop&auto=format'
            ];
        } finally {
            setIsLoadingImages(false);
        }
    };

    const loadImageAsBlob = async (imageUrl: string): Promise<HTMLImageElement> => {
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
    };

    const generatePreviewImage = async (index: number, img: HTMLImageElement): Promise<string> => {
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
    };

    const generateWallpaper = async (index: number): Promise<{ fullRes: string, preview: string }> => {
        const canvas = canvasRefs.current[index];
        if (!canvas) throw new Error('Canvas not found');

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not found');

        const dimensions = FORMATS[format];
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        try {
            // Get a random space image
            const randomImageUrl = SPACE_IMAGE_SOURCES[Math.floor(Math.random() * SPACE_IMAGE_SOURCES.length)];
            console.log('Loading image:', randomImageUrl);

            // Load the space image as blob to avoid CORS issues
            const img = await loadImageAsBlob(randomImageUrl);
            console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);

            // First generate the preview image
            const preview = await generatePreviewImage(index, img);
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
    };

    const generateAllWallpapers = async () => {
        setIsGenerating(true);
        try {
            // Ensure NASA images are loaded first
            if (SPACE_IMAGE_SOURCES.length === 0) {
                await fetchNASAImages();
            }

            // Small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 500));

            const results = [
                await generateWallpaper(0),
                await generateWallpaper(1),
                await generateWallpaper(2)
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
    };

    const downloadWallpaper = (dataUrl: string, index: number) => {
        const link = document.createElement('a');
        link.download = `zima-blue-wallpaper-${format}-${index + 1}.png`;
        link.href = dataUrl;
        link.click();
    };

    // Load NASA images on mount
    useEffect(() => {
        fetchNASAImages();
    }, []);

    // Generate wallpapers on mount and format change
    useEffect(() => {
        if (!isLoadingImages) {
            generateAllWallpapers();
        }
    }, [format, isLoadingImages]);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="p-8 border-b border-gray-800">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold mb-4">Zima Blue</h1>

                    <div className="flex justify-center gap-8 mb-4">
                        <button
                            onClick={() => setFormat('4k-desktop')}
                            className={`text-lg font-medium transition-colors ${format === '4k-desktop'
                                ? 'text-blue-400 border-b-2 border-blue-400 pb-1'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Desktop
                        </button>
                        <button
                            onClick={() => setFormat('phone')}
                            className={`text-lg font-medium transition-colors ${format === 'phone'
                                ? 'text-blue-400 border-b-2 border-blue-400 pb-1'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Phone
                        </button>
                    </div>

                    <p className="text-gray-400 text-sm max-w-md mx-auto">
                        Inspired by the iconic Zima Blue from Love, Death & Robots.
                        Generate wallpapers featuring real space imagery with the perfect blue rectangle.
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-6">
                <div className="max-w-7xl mx-auto">
                    {isLoadingImages ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-lg">Loading NASA images...</div>
                        </div>
                    ) : isGenerating ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-lg">Generating wallpapers...</div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6">
                            {wallpapers.map((wallpaper, index) => (
                                <div key={index} className="group relative w-full max-w-2xl">
                                    <div
                                        className="bg-gray-900 rounded-lg overflow-hidden relative w-full"
                                        style={{
                                            aspectRatio: format === '4k-desktop' ? '16/9' : '9/16',
                                            maxWidth: format === '4k-desktop' ? '800px' : '400px',
                                            margin: '0 auto'
                                        }}
                                    >
                                        {imageLoadErrors[index] ? (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                <div className="text-center">
                                                    <div className="text-lg mb-2">⚠️</div>
                                                    <div className="text-sm">Preview Error</div>
                                                    <div className="text-xs mt-1">Download still works</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <img
                                                src={previewImages[index] || wallpaper}
                                                alt={`Zima Blue wallpaper ${index + 1}`}
                                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200 relative z-10"
                                                style={{ display: 'block', position: 'relative' }}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    downloadWallpaper(wallpaper, index);
                                                }}
                                                onClick={() => downloadWallpaper(wallpaper, index)}
                                                onError={(e) => {
                                                    console.error('Image display error for wallpaper', index + 1, ':', e);
                                                    console.error('Preview image src:', previewImages[index]?.substring(0, 50) + '...');
                                                    console.error('Wallpaper src:', wallpaper?.substring(0, 50) + '...');
                                                    setImageLoadErrors(prev => {
                                                        const newErrors = [...prev];
                                                        newErrors[index] = true;
                                                        return newErrors;
                                                    });
                                                }}
                                                onLoad={(e) => {
                                                    console.log('Image loaded successfully for preview', index + 1);
                                                    console.log('Loaded src:', (previewImages[index] || wallpaper)?.substring(0, 50) + '...');
                                                    const img = e.target as HTMLImageElement;
                                                    console.log('Image dimensions:', img.naturalWidth, 'x', img.naturalHeight);
                                                    console.log('Image display size:', img.clientWidth, 'x', img.clientHeight);
                                                    console.log('Image visibility:', window.getComputedStyle(img).visibility);
                                                    console.log('Image opacity:', window.getComputedStyle(img).opacity);
                                                }}
                                            />
                                        )}
                                    </div>

                                    <div className="absolute inset-0 bg-transparent group-hover:bg-black group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center pointer-events-none">
                                        <button
                                            onClick={() => downloadWallpaper(wallpaper, index)}
                                            className="opacity-0 group-hover:opacity-100 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg font-medium transition-opacity duration-200 pointer-events-auto"
                                        >
                                            Download
                                        </button>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}

                    {wallpapers.length > 0 && (
                        <div className="mt-8 text-center text-gray-400 text-sm">
                            <p>powered by nasa</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Hidden canvases for image generation */}
            {[0, 1, 2].map((index) => (
                <div key={index}>
                    <canvas
                        ref={(el) => { canvasRefs.current[index] = el; }}
                        style={{ display: 'none' }}
                    />
                    <canvas
                        ref={(el) => { previewCanvasRefs.current[index] = el; }}
                        style={{ display: 'none' }}
                    />
                </div>
            ))}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { WallpaperFormat } from '../types/wallpaper';
import { useNASAImages } from '../hooks/useNASAImages';
import { useWallpaperGeneration } from '../hooks/useWallpaperGeneration';
import Header from './Header';
import LoadingState from './LoadingState';
import WallpaperGrid from './WallpaperGrid';
import HiddenCanvases from './HiddenCanvases';

export default function WallpaperGenerator() {
    const [format, setFormat] = useState<WallpaperFormat>('4k-desktop');
    
    const { spaceImageSources, isLoadingImages } = useNASAImages();
    const { 
        wallpapers, 
        previewImages, 
        isGenerating, 
        imageLoadErrors, 
        canvasRefs, 
        previewCanvasRefs, 
        generateAllWallpapers, 
        downloadWallpaper, 
        setImageError 
    } = useWallpaperGeneration();

    const handleDownload = (dataUrl: string, index: number) => {
        downloadWallpaper(dataUrl, index, format);
    };

    // Generate wallpapers when format changes or images are loaded
    useEffect(() => {
        if (!isLoadingImages && spaceImageSources.length > 0) {
            generateAllWallpapers(format, spaceImageSources);
        }
    }, [format, isLoadingImages, spaceImageSources, generateAllWallpapers]);

    return (
        <div className="min-h-screen bg-black text-white">
            <Header format={format} onFormatChange={setFormat} />

            <main className="p-6">
                <div className="max-w-7xl mx-auto">
                    {isLoadingImages ? (
                        <LoadingState message="Loading NASA images..." />
                    ) : isGenerating ? (
                        <LoadingState message="Generating wallpapers..." />
                    ) : (
                        <WallpaperGrid
                            wallpapers={wallpapers}
                            previewImages={previewImages}
                            format={format}
                            imageLoadErrors={imageLoadErrors}
                            onDownload={handleDownload}
                            onImageError={setImageError}
                        />
                    )}

                    {wallpapers.length > 0 && (
                        <div className="mt-8 text-center text-gray-400 text-sm">
                            <p>powered by nasa</p>
                        </div>
                    )}
                </div>
            </main>

            <HiddenCanvases 
                canvasRefs={canvasRefs} 
                previewCanvasRefs={previewCanvasRefs} 
            />
        </div>
    );
}

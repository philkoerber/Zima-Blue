import { WallpaperFormat } from '../types/wallpaper';

interface WallpaperItemProps {
    index: number;
    wallpaper: string;
    previewImage?: string;
    format: WallpaperFormat;
    hasError: boolean;
    onDownload: (wallpaper: string, index: number) => void;
    onImageError: (index: number, hasError: boolean) => void;
}

export default function WallpaperItem({
    index,
    wallpaper,
    previewImage,
    format,
    hasError,
    onDownload,
    onImageError
}: WallpaperItemProps) {
    const handleDownload = () => onDownload(wallpaper, index);

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        console.error('Image display error for wallpaper', index + 1, ':', e);
        console.error('Preview image src:', previewImage?.substring(0, 50) + '...');
        console.error('Wallpaper src:', wallpaper?.substring(0, 50) + '...');
        onImageError(index, true);
    };

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        console.log('Image loaded successfully for preview', index + 1);
        console.log('Loaded src:', (previewImage || wallpaper)?.substring(0, 50) + '...');
        const img = e.target as HTMLImageElement;
        console.log('Image dimensions:', img.naturalWidth, 'x', img.naturalHeight);
        console.log('Image display size:', img.clientWidth, 'x', img.clientHeight);
        console.log('Image visibility:', window.getComputedStyle(img).visibility);
        console.log('Image opacity:', window.getComputedStyle(img).opacity);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        handleDownload();
    };

    return (
        <div className="group relative w-full max-w-2xl">
            <div
                className="bg-gray-900 rounded-lg overflow-hidden relative w-full"
                style={{
                    aspectRatio: format === '4k-desktop' ? '16/9' : '9/16',
                    maxWidth: format === '4k-desktop' ? '800px' : '400px',
                    margin: '0 auto'
                }}
            >
                {hasError ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <div className="text-lg mb-2">⚠️</div>
                            <div className="text-sm">Preview Error</div>
                            <div className="text-xs mt-1">Download still works</div>
                        </div>
                    </div>
                ) : (
                    <img
                        src={previewImage || wallpaper}
                        alt={`Zima Blue wallpaper ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200 relative z-10"
                        style={{ display: 'block', position: 'relative' }}
                        onContextMenu={handleContextMenu}
                        onClick={handleDownload}
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                    />
                )}
            </div>

            <div className="absolute inset-0 bg-transparent group-hover:bg-black group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center pointer-events-none">
                <button
                    onClick={handleDownload}
                    className="opacity-0 group-hover:opacity-100 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg font-medium transition-opacity duration-200 pointer-events-auto"
                >
                    Download
                </button>
            </div>
        </div>
    );
}

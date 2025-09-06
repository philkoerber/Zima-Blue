import WallpaperItem from './WallpaperItem';
import { WallpaperFormat } from '../types/wallpaper';

interface WallpaperGridProps {
    wallpapers: string[];
    previewImages: string[];
    format: WallpaperFormat;
    imageLoadErrors: boolean[];
    onDownload: (wallpaper: string, index: number) => void;
    onImageError: (index: number, hasError: boolean) => void;
}

export default function WallpaperGrid({
    wallpapers,
    previewImages,
    format,
    imageLoadErrors,
    onDownload,
    onImageError
}: WallpaperGridProps) {
    return (
        <div className="flex flex-col items-center gap-6">
            {wallpapers.map((wallpaper, index) => (
                <WallpaperItem
                    key={index}
                    index={index}
                    wallpaper={wallpaper}
                    previewImage={previewImages[index]}
                    format={format}
                    hasError={imageLoadErrors[index]}
                    onDownload={onDownload}
                    onImageError={onImageError}
                />
            ))}
        </div>
    );
}

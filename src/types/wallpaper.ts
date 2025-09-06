export type WallpaperFormat = '4k-desktop' | 'phone';

export interface WallpaperDimensions {
    width: number;
    height: number;
}

export interface WallpaperResult {
    fullRes: string;
    preview: string;
}

export const FORMATS: Record<WallpaperFormat, WallpaperDimensions> = {
    '4k-desktop': { width: 3840, height: 2160 },
    'phone': { width: 1080, height: 1920 }
};

export const ZIMA_BLUE = '#5BC2E7';

// Fallback Unsplash images for reliable operation
export const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=3840&h=2160&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=3840&h=2160&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=3840&h=2160&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=3840&h=2160&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=3840&h=2160&fit=crop&auto=format'
];

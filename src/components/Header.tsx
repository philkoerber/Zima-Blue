import { WallpaperFormat } from '../types/wallpaper';

interface HeaderProps {
    format: WallpaperFormat;
    onFormatChange: (format: WallpaperFormat) => void;
}

export default function Header({ format, onFormatChange }: HeaderProps) {
    return (
        <header className="p-8 border-b border-gray-800">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-3xl font-bold mb-4">Zima Blue</h1>

                <div className="flex justify-center gap-8 mb-4">
                    <button
                        onClick={() => onFormatChange('4k-desktop')}
                        className={`text-lg font-medium transition-colors ${format === '4k-desktop'
                            ? 'text-zima-blue border-b-2 border-zima-blue pb-1'
                            : 'text-gray-400 hover:text-zima-blue'
                            }`}
                    >
                        Desktop
                    </button>
                    <button
                        onClick={() => onFormatChange('phone')}
                        className={`text-lg font-medium transition-colors ${format === 'phone'
                            ? 'text-zima-blue border-b-2 border-zima-blue pb-1'
                            : 'text-gray-400 hover:text-zima-blue'
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
    );
}

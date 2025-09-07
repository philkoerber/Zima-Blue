import { NextResponse } from 'next/server';
import { nasaCache } from '@/lib/cache';

interface APODResponse {
    date: string;
    explanation: string;
    hdurl?: string;
    media_type: string;
    service_version: string;
    title: string;
    url: string;
    copyright?: string;
}

interface MarsRoverPhoto {
    id: number;
    img_src: string;
    earth_date: string;
    rover: {
        name: string;
        status: string;
    };
    camera: {
        name: string;
        full_name: string;
    };
}

interface MarsRoverResponse {
    photos: MarsRoverPhoto[];
}

interface EarthImageryResponse {
    date: string;
    id: string;
    url: string;
}

interface NASAImageResult {
    url: string;
    title?: string;
    date?: string;
    source: 'apod' | 'mars_rover' | 'earth_imagery' | 'hubble';
}

// NASA API configuration
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const API_BASE_URL = 'https://api.nasa.gov';

// Rate limiting (requests per hour for free API key: 1000)
const RATE_LIMIT_DELAY = 100; // ms between requests

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to fetch with retry logic
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response;

            // If rate limited, wait longer
            if (response.status === 429) {
                await delay(2000 * (i + 1));
                continue;
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            if (i === retries - 1) throw error;
            await delay(1000 * (i + 1));
        }
    }
    throw new Error('Max retries exceeded');
}

// Get recent APOD images
async function getAPODImages(count = 10): Promise<NASAImageResult[]> {
    const images: NASAImageResult[] = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
        try {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            const url = `${API_BASE_URL}/planetary/apod?api_key=${NASA_API_KEY}&date=${dateString}`;
            const response = await fetchWithRetry(url);
            const data: APODResponse = await response.json();

            // Only include high-quality images
            if (data.media_type === 'image' && data.hdurl) {
                images.push({
                    url: data.hdurl,
                    title: data.title,
                    date: data.date,
                    source: 'apod'
                });
            }

            await delay(RATE_LIMIT_DELAY);
        } catch (error) {
            console.warn(`Failed to fetch APOD for day ${i}:`, error);
        }
    }

    return images;
}

// Get Mars rover images
async function getMarsRoverImages(): Promise<NASAImageResult[]> {
    const images: NASAImageResult[] = [];
    const rovers = [
        { name: 'curiosity', sol: 4000 },
        { name: 'perseverance', sol: 1000 },
        { name: 'opportunity', sol: 5000 }
    ];

    for (const rover of rovers) {
        try {
            const url = `${API_BASE_URL}/mars-photos/api/v1/rovers/${rover.name}/photos?sol=${rover.sol}&api_key=${NASA_API_KEY}&page=1`;
            const response = await fetchWithRetry(url);
            const data: MarsRoverResponse = await response.json();

            // Get high-quality images from different cameras
            const roverImages = data.photos
                .filter(photo => {
                    // Filter for high-quality images
                    const isHighRes = photo.img_src.includes('JPG') || photo.img_src.includes('jpg');
                    const isGoodCamera = !photo.camera.name.includes('NAVCAM'); // Skip navigation cameras
                    return isHighRes && isGoodCamera;
                })
                .sort((a, b) => new Date(b.earth_date).getTime() - new Date(a.earth_date).getTime()) // Most recent first
                .slice(0, 3)
                .map(photo => ({
                    url: photo.img_src,
                    title: `${rover.name.charAt(0).toUpperCase() + rover.name.slice(1)} - ${photo.camera.full_name}`,
                    date: photo.earth_date,
                    source: 'mars_rover' as const
                }));

            images.push(...roverImages);
            await delay(RATE_LIMIT_DELAY);
        } catch (error) {
            console.warn(`Failed to fetch ${rover.name} images:`, error);
        }
    }

    return images;
}

// Get Earth imagery from NASA
async function getEarthImages(): Promise<NASAImageResult[]> {
    try {
        // Get recent Earth imagery from Landsat
        const date = new Date();
        date.setDate(date.getDate() - 30); // Get images from 30 days ago
        const dateString = date.toISOString().split('T')[0];

        const url = `${API_BASE_URL}/planetary/earth/imagery?lon=-95.33&lat=29.78&date=${dateString}&dim=0.10&api_key=${NASA_API_KEY}`;
        const response = await fetchWithRetry(url);

        if (response.ok) {
            return [{
                url: url,
                title: 'Earth from Space',
                date: dateString,
                source: 'earth_imagery'
            }];
        }
    } catch (error) {
        console.warn('Failed to fetch Earth imagery:', error);
    }

    return [];
}

export async function GET() {
    try {
        console.log('Fetching NASA images with API key:', NASA_API_KEY.substring(0, 8) + '...');

        // Check cache first
        const cacheKey = 'nasa-images-combined';
        const cachedResult = nasaCache.get(cacheKey);

        if (cachedResult) {
            console.log('Returning cached NASA images');
            return NextResponse.json({
                ...cachedResult,
                cached: true,
                cache_age: Math.floor((Date.now() - cachedResult.timestamp) / 1000 / 60) // minutes
            });
        }

        // Fetch images from different NASA APIs in parallel
        const [apodImages, marsImages, earthImages] = await Promise.all([
            getAPODImages(8),
            getMarsRoverImages(),
            getEarthImages()
        ]);

        // Combine all NASA images
        const allNASAImages = [...apodImages, ...marsImages, ...earthImages];
        console.log(`Fetched ${allNASAImages.length} NASA images`);

        // Extract URLs and add metadata
        const imageUrls = allNASAImages.map(img => img.url);

        // Fallback images for reliability
        const fallbackImages = [
            'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=3840&h=2160&fit=crop&auto=format'
        ];

        // Combine NASA images with fallbacks if needed
        const finalImages = [...imageUrls];

        // Add fallback images if we don't have enough NASA images
        if (finalImages.length < 15) {
            finalImages.push(...fallbackImages);
        }

        // Remove duplicates and filter out invalid URLs
        const uniqueImages = [...new Set(finalImages)]
            .filter(url => {
                try {
                    new URL(url);
                    return true;
                } catch {
                    return false;
                }
            });

        // Shuffle and limit results
        const shuffledImages = uniqueImages
            .sort(() => Math.random() - 0.5)
            .slice(0, 20);

        const result = {
            success: true,
            images: shuffledImages,
            source: imageUrls.length > 0 ? 'nasa_api' : 'fallback',
            metadata: {
                nasa_images_count: imageUrls.length,
                apod_count: apodImages.length,
                mars_count: marsImages.length,
                earth_count: earthImages.length,
                total_returned: shuffledImages.length
            },
            timestamp: Date.now(),
            cached: false
        };

        // Cache the result for 2 hours (NASA images don't change frequently)
        nasaCache.set(cacheKey, result, 120);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error fetching NASA images:', error);

        // Return fallback images on error
        const fallbackImages = [
            'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=3840&h=2160&fit=crop&auto=format'
        ];

        return NextResponse.json({
            success: false,
            images: fallbackImages,
            source: 'fallback',
            error: error instanceof Error ? error.message : 'Failed to fetch NASA images',
            metadata: {
                nasa_images_count: 0,
                total_returned: fallbackImages.length
            }
        });
    }
}

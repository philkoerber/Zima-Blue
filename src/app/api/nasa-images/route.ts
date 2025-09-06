import { NextResponse } from 'next/server';

interface APODResponse {
    date: string;
    explanation: string;
    hdurl?: string;
    media_type: string;
    service_version: string;
    title: string;
    url: string;
}

interface MarsRoverPhoto {
    id: number;
    img_src: string;
    earth_date: string;
    rover: {
        name: string;
    };
}

interface MarsRoverResponse {
    photos: MarsRoverPhoto[];
}

// NASA API key - you can use DEMO_KEY for testing but should get your own
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

export async function GET() {
    try {
        const images: string[] = [];

        // Fetch recent APOD images (last 10 days)
        const today = new Date();
        const apodPromises = [];

        for (let i = 0; i < 10; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            apodPromises.push(
                fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${dateString}`)
                    .then(res => res.json())
                    .then((data: APODResponse) => {
                        // Only include images (not videos) with HD URLs
                        if (data.media_type === 'image' && data.hdurl) {
                            return data.hdurl;
                        }
                        return null;
                    })
                    .catch(() => null)
            );
        }

        // Fetch Mars rover images
        const marsRoverPromises = [
            // Curiosity recent photos
            fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=4000&api_key=${NASA_API_KEY}`)
                .then(res => res.json())
                .then((data: MarsRoverResponse) =>
                    data.photos.slice(0, 5).map(photo => photo.img_src)
                )
                .catch(() => []),

            // Perseverance recent photos  
            fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/photos?sol=1000&api_key=${NASA_API_KEY}`)
                .then(res => res.json())
                .then((data: MarsRoverResponse) =>
                    data.photos.slice(0, 5).map(photo => photo.img_src)
                )
                .catch(() => [])
        ];

        // Wait for all API calls to complete
        const [apodResults, ...marsResults] = await Promise.all([
            Promise.all(apodPromises),
            ...marsRoverPromises
        ]);

        // Collect all valid image URLs
        apodResults.forEach(url => {
            if (url) images.push(url);
        });

        marsResults.forEach(marsPhotos => {
            if (Array.isArray(marsPhotos)) {
                images.push(...marsPhotos);
            }
        });

        // Fallback to reliable Unsplash images if we don't get enough NASA images
        const fallbackImages = [
            'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=3840&h=2160&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=3840&h=2160&fit=crop&auto=format'
        ];

        // Ensure we have at least 10 images
        while (images.length < 10) {
            images.push(...fallbackImages);
        }

        // Return a random selection of images
        const shuffledImages = images.sort(() => Math.random() - 0.5);

        return NextResponse.json({
            success: true,
            images: shuffledImages.slice(0, 20), // Return 20 images for variety
            source: 'nasa_api'
        });

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
            error: 'Failed to fetch NASA images'
        });
    }
}

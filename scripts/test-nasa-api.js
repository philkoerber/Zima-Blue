/**
 * Simple test script for NASA API integration
 * Run with: node scripts/test-nasa-api.js
 */

const https = require('https');

// Test configuration
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const BASE_URL = 'https://api.nasa.gov';

// Helper function to make HTTP requests
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Test functions
async function testAPOD() {
    console.log('\n🌌 Testing APOD API...');

    try {
        const today = new Date().toISOString().split('T')[0];
        const url = `${BASE_URL}/planetary/apod?api_key=${NASA_API_KEY}&date=${today}`;

        const result = await makeRequest(url);

        if (result.status === 200 && result.data.url) {
            console.log('✅ APOD API working');
            console.log(`   Title: ${result.data.title}`);
            console.log(`   Date: ${result.data.date}`);
            console.log(`   Media Type: ${result.data.media_type}`);
            console.log(`   HD URL: ${result.data.hdurl ? 'Available' : 'Not available'}`);
        } else {
            console.log('❌ APOD API failed');
            console.log('   Response:', result.data);
        }
    } catch (error) {
        console.log('❌ APOD API error:', error.message);
    }
}

async function testMarsRover() {
    console.log('\n🚀 Testing Mars Rover API...');

    try {
        const url = `${BASE_URL}/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&api_key=${NASA_API_KEY}&page=1`;

        const result = await makeRequest(url);

        if (result.status === 200 && result.data.photos) {
            console.log('✅ Mars Rover API working');
            console.log(`   Photos found: ${result.data.photos.length}`);

            if (result.data.photos.length > 0) {
                const photo = result.data.photos[0];
                console.log(`   Sample photo: ${photo.rover.name} - ${photo.camera.full_name}`);
                console.log(`   Earth date: ${photo.earth_date}`);
            }
        } else {
            console.log('❌ Mars Rover API failed');
            console.log('   Response:', result.data);
        }
    } catch (error) {
        console.log('❌ Mars Rover API error:', error.message);
    }
}

async function testEarthImagery() {
    console.log('\n🌍 Testing Earth Imagery API...');

    try {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        const dateString = date.toISOString().split('T')[0];

        const url = `${BASE_URL}/planetary/earth/imagery?lon=-95.33&lat=29.78&date=${dateString}&dim=0.10&api_key=${NASA_API_KEY}`;

        const result = await makeRequest(url);

        if (result.status === 200) {
            console.log('✅ Earth Imagery API working');
            console.log(`   Image URL generated for date: ${dateString}`);
        } else {
            console.log('❌ Earth Imagery API failed');
            console.log('   Response:', result.data);
        }
    } catch (error) {
        console.log('❌ Earth Imagery API error:', error.message);
    }
}

async function testRateLimits() {
    console.log('\n⏱️  Testing Rate Limits...');

    const startTime = Date.now();
    const promises = [];

    // Make 5 concurrent requests to test rate limiting
    for (let i = 0; i < 5; i++) {
        const url = `${BASE_URL}/planetary/apod?api_key=${NASA_API_KEY}`;
        promises.push(makeRequest(url));
    }

    try {
        const results = await Promise.all(promises);
        const endTime = Date.now();
        const duration = endTime - startTime;

        const successCount = results.filter(r => r.status === 200).length;
        const rateLimitCount = results.filter(r => r.status === 429).length;

        console.log(`✅ Rate limit test completed in ${duration}ms`);
        console.log(`   Successful requests: ${successCount}/5`);
        console.log(`   Rate limited requests: ${rateLimitCount}/5`);

        if (rateLimitCount > 0) {
            console.log('⚠️  You may be hitting rate limits. Consider getting a personal API key.');
        }
    } catch (error) {
        console.log('❌ Rate limit test error:', error.message);
    }
}

// Main test function
async function runTests() {
    console.log('🚀 NASA API Integration Test');
    console.log('============================');
    console.log(`API Key: ${NASA_API_KEY.substring(0, 8)}...`);

    if (NASA_API_KEY === 'DEMO_KEY') {
        console.log('⚠️  Using DEMO_KEY - limited to 30 requests/hour, 50/day');
        console.log('   Get your free API key at: https://api.nasa.gov/');
    }

    await testAPOD();
    await testMarsRover();
    await testEarthImagery();
    await testRateLimits();

    console.log('\n✨ Test completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. If using DEMO_KEY, get your personal NASA API key');
    console.log('   2. Add NASA_API_KEY=your_key to .env.local');
    console.log('   3. Test your Next.js app at /api/nasa-images');
}

// Run the tests
runTests().catch(console.error);

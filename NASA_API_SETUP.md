# NASA API Integration Guide 🚀

This guide will help you properly set up and test the NASA API integration for your Zima Blue wallpaper generator.

## 🔑 Step 1: Get Your NASA API Key

1. **Visit the NASA API Portal**: Go to [https://api.nasa.gov/](https://api.nasa.gov/)
2. **Generate API Key**: Click "Generate API Key" button
3. **Fill the Form**: 
   - First Name
   - Last Name  
   - Email Address
   - Application URL (optional - you can use `http://localhost:3000`)
4. **Submit**: You'll receive your API key instantly via email

## 🔧 Step 2: Environment Setup

Create a `.env.local` file in your project root:

```bash
# NASA API Configuration
NASA_API_KEY=your_actual_nasa_api_key_here

# Optional: Rate limiting configuration  
NASA_API_RATE_LIMIT=1000
NASA_API_RATE_WINDOW=3600
```

**Important Notes:**
- Never commit your `.env.local` file to version control
- The DEMO_KEY has strict limits: 30 requests/hour, 50/day
- Your personal key allows 1000 requests/hour

## 🛠️ Step 3: Available NASA APIs

Your integration now uses multiple NASA APIs:

### 1. **APOD (Astronomy Picture of the Day)**
- **Endpoint**: `/planetary/apod`
- **What it provides**: Daily astronomy images with HD versions
- **Usage**: Fetches last 8 days of images

### 2. **Mars Rover Photos**  
- **Endpoint**: `/mars-photos/api/v1/rovers/{rover}/photos`
- **Rovers**: Curiosity, Perseverance, Opportunity
- **What it provides**: High-resolution Mars surface images

### 3. **Earth Imagery**
- **Endpoint**: `/planetary/earth/imagery`
- **What it provides**: Satellite images of Earth from space

## 🧪 Step 4: Testing Your Setup

### Test 1: Basic API Connection
```bash
# Test your API key with a simple APOD request
curl "https://api.nasa.gov/planetary/apod?api_key=YOUR_API_KEY"
```

### Test 2: Local Development
1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Visit your NASA images endpoint:
   ```
   http://localhost:3000/api/nasa-images
   ```

3. Check the browser console and server logs for:
   - API key being used (first 8 characters shown)
   - Number of images fetched from each source
   - Cache status

### Test 3: API Response Structure
Your API now returns enhanced metadata:

```json
{
  "success": true,
  "images": ["url1", "url2", ...],
  "source": "nasa_api",
  "cached": false,
  "metadata": {
    "nasa_images_count": 15,
    "apod_count": 6,
    "mars_count": 8, 
    "earth_count": 1,
    "total_returned": 20
  },
  "timestamp": 1703123456789
}
```

## 🚀 Step 5: Features & Improvements

### ✅ What's New:
- **Multiple NASA APIs**: APOD, Mars Rovers, Earth Imagery
- **Smart Caching**: 2-hour cache to reduce API calls
- **Rate Limiting**: Built-in delays to respect API limits
- **Retry Logic**: Automatic retries with exponential backoff
- **Better Error Handling**: Graceful fallbacks to Unsplash
- **Enhanced Metadata**: Detailed response information

### 🔧 Configuration Options:
- **Cache Duration**: Modify cache TTL in the route handler
- **Image Count**: Adjust number of APOD images fetched
- **Rate Limiting**: Customize delays between API calls
- **Fallback Images**: Update Unsplash fallback URLs

## 🐛 Troubleshooting

### Common Issues:

1. **"DEMO_KEY Rate Limit Exceeded"**
   - Solution: Get your personal NASA API key
   - Temporary fix: Wait for rate limit reset

2. **"No NASA images returned"**
   - Check your API key in `.env.local`
   - Verify internet connection
   - Check NASA API status: [https://api.nasa.gov/](https://api.nasa.gov/)

3. **Images not loading in UI**
   - Some NASA image URLs may have CORS restrictions
   - The proxy endpoint at `/api/proxy-image` should handle this

4. **Slow response times**
   - First request after cache expiry will be slower
   - Subsequent requests use cached data
   - Consider reducing the number of API calls

### Debug Mode:
Check the browser console and server logs for detailed information:
- API key usage
- Cache hit/miss status
- Number of images from each source
- Error messages and retry attempts

## 📊 API Limits & Best Practices

### NASA API Limits:
- **DEMO_KEY**: 30 requests/hour, 50/day
- **Personal Key**: 1000 requests/hour
- **Rate Limiting**: Built-in 100ms delays between requests

### Best Practices:
1. **Use Caching**: Current implementation caches for 2 hours
2. **Handle Failures**: Always have fallback images
3. **Monitor Usage**: Keep track of API calls in production
4. **Optimize Requests**: Don't fetch more images than needed

## 🔄 Next Steps

Consider these enhancements:
- Add more NASA APIs (Hubble, James Webb Space Telescope)
- Implement user preferences for image sources
- Add image quality filtering
- Create admin dashboard for API monitoring
- Add image metadata display in UI

## 📞 Support

If you encounter issues:
1. Check the NASA API documentation: [https://api.nasa.gov/](https://api.nasa.gov/)
2. Verify your API key is correctly set in `.env.local`
3. Check the browser console and server logs for error details
4. Test the API endpoints directly using curl or Postman

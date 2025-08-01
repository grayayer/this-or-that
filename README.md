# This or That? - Design Preference Discovery

A web application that helps users discover their design preferences through binary choices between web design screenshots. Users make quick decisions between pairs of designs to build a comprehensive preference profile.

## 🚀 Features

- **Binary Choice Interface**: Simple "this or that" selection between design pairs
- **Preference Analysis**: Comprehensive analysis of design preferences based on choices
- **Progress Tracking**: Visual progress indicators and session management
- **Results Export**: Print/PDF export and email sharing capabilities
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Performance Optimized**: Advanced caching, image optimization, and smooth animations
- **Offline Support**: Service worker enables offline functionality

## 🏗️ Architecture

### Core Components

- **Data Loader** (`js/app-data-loader.js`): Handles design data loading with validation and offline support
- **Results Engine** (`js/results.js`): Analyzes user choices and generates preference profiles
- **Image Optimizer** (`js/image-optimizer.js`): Optimizes images with WebP support and compression
- **Timer System** (`js/timer.js`): Manages choice timing and user interaction feedback
- **Print System** (`js/print.js`): Handles PDF generation and print formatting

### Data Sources

- **Primary Data**: `data/designs.json` - Main design database
- **Fallback Data**: `data/sample-designs.json` - Development and offline fallback
- **Scraper Tool**: `scraper/` - Automated data collection from Land-book.com

## ⚡ Performance Optimizations

The application includes comprehensive performance optimizations for fast loading and smooth user experience:

### 1. Service Worker Caching (`sw.js`)

- **Cache First Strategy**: Static assets (CSS, JS, HTML) served from cache
- **Network First Strategy**: Dynamic content and images with cache fallback
- **Stale While Revalidate**: JSON data served from cache while updating in background
- **Offline Fallbacks**: Custom offline pages and image placeholders
- **Automatic Cache Management**: Old caches cleaned up automatically

### 2. Image Optimization (`js/image-optimizer.js`)

- **WebP Format Support**: Automatic WebP detection and conversion
- **Image Compression**: Canvas-based compression for better performance
- **Responsive Images**: Multiple sizes generated for different screen sizes
- **CDN Optimization**: URL optimization for Land-book CDN
- **Lazy Loading**: Images loaded only when needed
- **Preloading**: Next images preloaded in background for smooth transitions

### 3. JavaScript Bundle Optimization

- **Memory Monitoring**: Automatic memory usage tracking and warnings
- **Enhanced Loading States**: Smooth transitions between loading states
- **Error Recovery**: Robust error handling with retry mechanisms
- **Performance Metrics**: Built-in performance monitoring and reporting

### 4. Smooth Animations and Transitions

- **GPU Acceleration**: Hardware-accelerated animations using `transform: translateZ(0)`
- **Cubic-Bezier Easing**: Smooth, natural animation curves
- **Staggered Animations**: Results appear with elegant timing
- **Reduced Motion Support**: Respects user accessibility preferences
- **Performance-Optimized**: Animations optimized for 60fps on all devices

### Performance Features

- **Connection-Aware**: Reduces animations and effects on slow connections
- **Battery-Conscious**: Minimal animations for users with low battery
- **High-DPI Optimization**: Enhanced rendering for retina displays
- **Memory Management**: Automatic cleanup and optimization
- **Network Status Monitoring**: Real-time connection status tracking

## 🛠️ Development Setup

### Prerequisites

- Python 3.x (for local server)
- Modern web browser with service worker support
- Node.js (optional, for advanced development)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd this-or-that
   ```

2. **Start local server**

   ```bash
   python3 -m http.server 8000
   ```

3. **Open application**

   ```
   http://localhost:8000
   ```

### Development Tools

- **Cache Manager**: `http://localhost:8000/cache-manager.html` - Manage caches and storage
- **Performance Tests**: `http://localhost:8000/test-performance-optimizations.html`
- **Debug Tools**: Various test pages for component testing

## 🐛 Debugging and Cache Management

### Common Cache Issues

The application uses aggressive caching for performance, which can sometimes interfere with development:

#### Symptoms

- Changes not appearing after refresh
- Old JavaScript code still running
- "Something went wrong" errors after updates
- Outdated design data loading

#### Solutions

**Method 1: Cache Manager (Recommended)**

1. Open `http://localhost:8000/cache-manager.html`
2. Click "Complete Reset" to clear everything
3. Refresh the main application

**Method 2: Chrome DevTools**

1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Click "Storage" in left sidebar
4. Click "Clear site data"
5. Refresh the page

**Method 3: Manual Clearing**

1. Chrome DevTools → Application → Storage
2. Clear each individually:
   - Service Workers: Unregister
   - Cache Storage: Delete all caches
   - Local Storage: Clear
   - Session Storage: Clear

**Method 4: Incognito Mode**

- Open application in incognito/private browsing mode
- Bypasses all caches for clean testing

### Development Best Practices

1. **Use Cache Manager**: Bookmark `cache-manager.html` for quick access
2. **Incognito Testing**: Test major changes in incognito mode first
3. **Version Parameters**: Scripts include `?v=1` parameters to bust cache
4. **Service Worker**: Can be disabled in `index.html` for development

### Cache Management Commands

```javascript
// Clear all caches programmatically
caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
});

// Clear local storage
localStorage.clear();
sessionStorage.clear();

// Unregister service worker
navigator.serviceWorker.getRegistration().then(reg => {
    if (reg) reg.unregister();
});
```

## 📊 Testing

### Test Pages

- `test-performance-optimizations.html` - Performance feature testing
- `test-enhanced-error-handling.html` - Error handling validation
- `test-mobile-enhancements.html` - Mobile-specific features
- `test-results-display.html` - Results generation testing
- `working-app.html` - Simplified version for debugging

### Running Tests

1. Start local server: `python3 -m http.server 8000`
2. Navigate to test pages: `http://localhost:8000/test-*.html`
3. Check browser console for detailed test results

## 🔧 Configuration

### Environment Variables

The application can be configured through the app initialization:

```javascript
await initializeApp({
    dataPath: 'data/designs.json',           // Primary data source
    fallbackDataPath: 'data/sample-designs.json', // Fallback data
    enableLogging: true,                     // Console logging
    timerDuration: 15,                       // Choice timer (seconds)
    minChoicesRequired: 20                   // Minimum choices for results
});
```

### Service Worker Configuration

Cache names and strategies can be modified in `sw.js`:

```javascript
const CACHE_NAME = 'this-or-that-v1.0.0';
const STATIC_CACHE_NAME = 'this-or-that-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'this-or-that-dynamic-v1.0.0';
```

## 📱 Browser Support

### Minimum Requirements

- Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- Service Worker support
- ES6+ JavaScript features
- CSS Grid and Flexbox support

### Progressive Enhancement

- Works without service worker (reduced performance)
- Graceful degradation for older browsers
- Fallbacks for unsupported features

## 🚀 Deployment

### Production Checklist

1. **Enable Service Worker**: Ensure service worker registration is active
2. **Update Cache Versions**: Increment cache names in `sw.js`
3. **Optimize Images**: Ensure all images are properly optimized
4. **Test Performance**: Run performance tests before deployment
5. **Clear Development Caches**: Use cache manager to reset everything

### Performance Monitoring

The application includes built-in performance monitoring:

- Core Web Vitals tracking
- Memory usage monitoring
- Network status detection
- Cache hit/miss ratios
- Image loading performance

## 📄 License

[Add your license information here]

## 🤝 Contributing

[Add contribution guidelines here]

## 📞 Support

If you encounter cache-related issues during development:

1. Try the Cache Manager tool first
2. Check browser console for error messages
3. Test in incognito mode to isolate cache issues
4. Review the debugging section above

For performance issues:

1. Run the performance test suite
2. Check network conditions
3. Monitor memory usage in DevTools
4. Verify service worker status

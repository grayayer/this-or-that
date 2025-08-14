# Changelog

All notable changes to the This or That application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.4] - 2025-08-14

### Fixed

- **Image Path Update**: Fixed merge script to properly update image paths when copying designs
  - Images paths now correctly point to `data/images/filename.webp` instead of relative scraped paths
  - Prevents broken image references after merging scraped data
  - Ensures consistent image path format across all designs

### Technical Details

- Added `updateImagePath()` method to merge script that extracts filename and updates path
- Image paths are now updated during the merge process before adding/updating designs
- All existing relative paths (e.g., `./personal_files/image.webp`) are converted to `data/images/image.webp`

## [0.8.3] - 2025-08-13

### Added

- **Data Merge System**: Complete suite of scripts for merging scraped data into main database
  - `merge-scraped-data.js` - Main merge script with intelligent data merging
  - `merge-helper.js` - Interactive helper for easy file selection
  - `validate-merged-data.js` - Data integrity validation tool
- **Automatic Backup System**: Creates timestamped backups before each merge operation
- **Intelligent Tag Merging**: Combines and deduplicates tag arrays when merging designs
- **Image Management**: Automatically copies images from scraped directories to main images folder
- **Comprehensive Error Handling**: Detailed error reporting and graceful failure handling
- **Merge Statistics**: Detailed reporting of merge operations (new, updated, skipped designs)

### Features

- Merge new scraped JSON files into `data/designs.json`
- Copy associated images to `data/images/` directory
- Preserve existing design data while updating with new information
- Validate data integrity after merging operations
- Auto-discovery of scraped files with metadata display

### Documentation

- Added `MERGE-DATA-README.md` with comprehensive usage instructions
- Detailed workflow examples and troubleshooting guide
- Best practices for data merging operations

## [0.8.2] - 2025-08-13

### Fixed

- **Critical Bug Fix**: Fixed `saveResults` method in scraper that was excluding `websiteUrl`, `source`, and `sourceUrl` properties from output
- **Data Output Completeness**: Ensured all scraped properties are properly included in final JSON output
- **CLI Scraper Functionality**: Fixed command-line scraping to produce complete data structure

### Technical Details

- Updated `saveResults` method to include all scraped properties in output mapping
- Fixed property filtering that was causing data loss during JSON generation
- Verified new scraping runs now include all required properties

## [0.8.1] - 2025-08-13

### Fixed

- **Data Structure Completeness**: Added missing `source` and `sourceUrl` properties to scraped data to match expected format
- **Metadata Scraper Enhancement**: Updated scraper to include Land-book source attribution and page URLs
- **Data Consistency**: Ensured all scraped designs have consistent property structure with reference data

### Technical Details

- Enhanced `scrape-metadata.js` to add `source: "land-book"` and `sourceUrl` properties
- Updated existing scraped data (220 designs) to include missing properties
- Verified `websiteUrl` extraction works correctly (when available on source pages)
- Maintained backward compatibility with existing data structure

## [0.8.0] - 2025-08-13

### Added: Robust Web Scraping Infrastructure

### Added

- **Enhanced Metadata Scraper**: Improved `scrape-metadata.js` with browser crash recovery and session management
- **Browser Recovery System**: Automatic browser reinitialization when sessions crash or become detached
- **Periodic Browser Restart**: Automatic browser restart every 50 items to prevent memory leaks and crashes
- **Resume Scraping Tool**: New `resume-scraping.js` for identifying and re-processing failed items
- **Failed Items Analysis**: New `check-failed-items.js` for analyzing scraping success rates and identifying failures
- **Error Recovery Logic**: Intelligent retry mechanism for browser session errors and protocol failures
- **Large Dataset Support**: Successfully tested with 220+ websites with 100% completion rate

### Enhanced

- **Scraping Reliability**: Improved from 69% to 100% success rate on large datasets through error recovery
- **Session Management**: Better handling of long-running scraping sessions with automatic cleanup
- **Memory Management**: Prevents browser memory leaks through periodic restarts and proper session cleanup
- **Error Handling**: Comprehensive error detection and recovery for common browser automation issues
- **Data Integrity**: Ensures complete metadata extraction even when individual items fail initially

### Technical Improvements

- **Browser Lifecycle Management**: Added `reinitializeBrowser()` method for crash recovery
- **Session Validation**: Added `page.isClosed()` checks before operations
- **Retry Logic**: Automatic retry for browser session errors with exponential backoff
- **Process Monitoring**: Better tracking of successful vs failed items with detailed statistics
- **Cleanup Procedures**: Proper browser cleanup and resource management

### Fixed

- **Browser Crashes**: Resolved "Protocol error (Page.navigate): Session closed" errors
- **Detached Frame Errors**: Fixed "Attempted to use detached Frame" issues through session validation
- **Memory Leaks**: Prevented browser memory accumulation through periodic restarts
- **Large Dataset Failures**: Eliminated cascading failures in large scraping jobs (200+ items)
- **Session Recovery**: Automatic recovery from browser crashes without losing progress

### Developer Experience

- **Comprehensive Logging**: Detailed progress tracking and error reporting
- **Resume Functionality**: Ability to resume failed scraping jobs from where they left off
- **Analysis Tools**: Built-in tools for analyzing scraping success rates and identifying problem areas
- **Test Utilities**: Enhanced testing capabilities for validating scraper improvements
- **Documentation**: Updated README with new tools and best practices

### Performance

- **100% Success Rate**: Achieved complete success on 220-item dataset through robust error handling
- **Efficient Recovery**: Fast browser reinitialization minimizes downtime during crashes
- **Resource Optimization**: Better memory usage through periodic cleanup and restart cycles
- **Scalable Architecture**: Designed to handle datasets of 500+ items reliably

## [0.7.2] - 2025-08-12

### Added

- **Enter Key Support**: Added Enter key functionality to trigger the "Start Discovering" button on the welcome screen
- **Keyboard Hint**: Added visual tip in instructions showing users can press Enter to start

### Improved

- **User Experience**: Enhanced accessibility and speed of getting started with keyboard navigation
- **Instructions Clarity**: Better guidance on available keyboard shortcuts

## [0.7.1] - 2025-08-12

### Fixed

- **Pseudo-Element Overlay**: Fixed critical issue where pseudo-elements cannot be applied directly to `<img>` tags
- **Image Wrapper Structure**: Added `.image-wrapper` div around images to properly support pseudo-element overlays
- **Real Image URLs**: Resolved issue where overlay wouldn't appear with actual image URLs (vs placeholder URLs)
- **Browser Compatibility**: Ensured overlay works consistently across all browsers and image loading states

### Technical Improvements

- **HTML Structure**: Updated to use `<div class="image-wrapper">` around `<img>` elements
- **CSS Refactor**: Moved pseudo-element from `.design-image::before` to `.image-wrapper::before`
- **JavaScript Updates**: Updated click handlers to work with new wrapper structure
- **Replaced Element Support**: Proper handling of CSS limitations with replaced elements like `<img>`

## [0.7.0] - 2025-08-12

### Added

- **Website Information Display**: Added website name and heart button underneath each image
- **Website Links**: Website names are now clickable links that open the source website in a new tab
- **Improved Heart Icons**: Changed from emoji hearts (🤍/❤️) to Unicode glyphs (♡/♥) for better visibility and consistency

### Changed

- **Overlay System**: Completely reimplemented image overlay using CSS pseudo-elements (::before) instead of DOM elements
- **Click Handling**: Refined click areas so only image/overlay triggers selection, while website links and heart buttons work independently
- **Hover Behavior**: Overlay now only appears when hovering directly over the image, not the entire container
- **User Experience**: Clear visual separation between selectable image area and interactive website information

### Fixed

- **Overlay Positioning**: Eliminated height mismatch issues between overlay and image
- **Click Conflicts**: Resolved issues where clicking website links or heart buttons would trigger image selection
- **Responsive Design**: Improved mobile layout for website information section

### Technical Improvements

- **Cleaner DOM**: Removed unnecessary HTML overlay elements
- **Better Performance**: Fewer DOM nodes and CSS-only animations
- **Maintainability**: Simplified code structure with pseudo-element approach
- **Browser Compatibility**: Enhanced cross-browser support with fallback hover states

## [0.6.6] - 2025-08-12

### Changed

- **Keyboard Navigation**: Updated keyboard shortcuts from number keys (1, 2) to arrow keys (←, →) for more intuitive left/right selection
- **User Interface**: Updated all keyboard hints and instructions to reflect new arrow key shortcuts

### Development Configuration

- **SiteGround Caching**: Added `cache-control: no-cache` meta tag to disable SiteGround Dynamic Caching during development
- **Production Note**: Remove cache-control meta tag before production deployment to enable caching for better performance

## [0.6.5] - 2025-08-08

## Fix

- show settings at all times instead of hide/show. Simplifies things.

## [0.6.4] - 2025-08-08

### Added: Persistent Settings Modal

### Added

- **Header Settings Button**: Persistent settings button in header available throughout the entire session
- **Settings Modal**: Professional modal dialog for app configuration accessible anytime during usage
- **Timer Pause Integration**: Automatically pauses active timers when settings modal opens
- **Modal Timer Controls**: Dedicated timer configuration controls within the modal interface
- **Session Persistence**: Settings button appears when app becomes active and hides during instructions
- **Keyboard Support**: ESC key closes modal, proper focus management and accessibility
- **Backdrop Interaction**: Click outside modal to close, with smooth backdrop blur effect

### Enhanced

- **Always Available**: Users can adjust timer settings at any point during their session
- **Professional UI**: Clean modal design with proper header, body, and footer sections
- **Smooth Animations**: Modal slides in/out with scale and opacity transitions
- **Mobile Responsive**: Modal adapts to mobile screens with full-width buttons and optimized spacing
- **Timer Integration**: Seamless integration with existing timer system and configuration

## [0.6.3] - 2025-08-08

### Added: Configurable Timer Duration with Clean UX

### Added

- **Timer Configuration Slider**: Users can now adjust timer duration from 15-60 seconds in 5-second increments
- **Disable Timer Option**: Added checkbox to completely disable the timer for users who prefer no time pressure
- **Settings Toggle Button**: Clean UX with configuration options hidden behind a settings button (⚙️)
- **Persistent Settings**: Timer preferences are saved in localStorage and persist across sessions
- **Real-time Updates**: Timer configuration changes are applied immediately without page refresh
- **Visual Feedback**: Timer display updates dynamically to show current setting (∞ when disabled)

### Enhanced

- **Clean Interface**: Configuration options are hidden by default, keeping the interface uncluttered
- **Progressive Disclosure**: Settings button reveals advanced options only when needed
- **Smooth Animations**: Configuration panel slides in/out with smooth CSS transitions
- **User Experience**: Accommodates users with different decision-making speeds and anxiety levels
- **Accessibility**: Larger touch targets on mobile devices and proper ARIA attributes
- **Responsive Design**: Timer configuration adapts to mobile layouts with optimized sizing

### Technical Implementation

- **Settings Modal Module**: New `js/settings-modal.js` with complete modal management system
- **Header Integration**: Dynamic settings button that shows/hides based on app state
- **Timer Pause/Resume**: Automatic timer state management when modal opens/closes
- **Modal State Management**: Complete state tracking with proper cleanup and error handling
- **App State Integration**: Listens for app state changes to show/hide settings appropriately
- **DOM Management**: Proper focus management, body scroll prevention, and cleanup
- **Test Suite**: Complete test page (`test-settings-modal.html`) for modal functionality verification

### Previous Implementation (0.6.3)

- **Timer Configuration Module**: New `js/timer-config.js` with complete configuration management
- **Toggle Functionality**: `toggleTimerConfig()` function with smooth show/hide animations
- **Integration Layer**: Seamless integration with existing timer system (`js/timer.js`)
- **LocalStorage Persistence**: Automatic saving and loading of user preferences including visibility state
- **CSS Animations**: Smooth slide-in/out transitions with opacity and transform effects
- **Mobile Optimization**: Enhanced touch interaction and responsive design
- **Test Suite**: Complete test page (`test-timer-config.html`) for functionality verification

### User Interface

- **Settings Button**: Clean toggle button with Font Awesome settings SVG icon and descriptive text
- **Professional Icon**: Replaced emoji with scalable SVG icon for better visual consistency
- **Hidden by Default**: Configuration panel starts hidden for cleaner initial experience
- **Smooth Transitions**: CSS animations for panel show/hide with proper timing
- **Slider Control**: Smooth range slider with labeled increments (15s, 30s, 45s, 60s)
- **Disable Option**: Clear checkbox with descriptive text for timer disable functionality
- **Visual States**: Disabled state styling and dynamic text updates
- **Instruction Updates**: Dynamic instruction text that reflects current timer setting

### Future Considerations

- Built with extensibility in mind for potential future removal of disable option
- Modular design allows for easy configuration changes
- Comprehensive error handling and fallback mechanisms

## [0.6.2] - 2025-08-07

### Fixed: Print Tip Display Issue

### Fixed

- **Print/PDF Output**: Print tip box no longer appears in printed results or saved PDFs
- **Screen-Only Display**: Print tip now only shows on screen when needed, not in print output
- **Clean Printing**: Removed visual clutter from printed/PDF versions of results

### Technical

- Updated `css/print.css` to hide `#print-tip` and `#copy-feedback` elements during print
- Added proper `@media print` rules to ensure clean print output
- Created test page (`test-print-tip.html`) to verify print behavior

## [0.6.1] - 2025-08-07

### Enhanced: Expanded Top Favorites Display

### Changed

- **Favorites Display**: Expanded "Your Top 5 Favorite Designs" to show up to 10 favorites
- **Better Coverage**: Users can now see more of their preferred designs in results
- **Dynamic Labeling**: Section title now shows actual count (e.g., "Your Top 7 Favorite Designs")
- **Improved UX**: More comprehensive view of user preferences

### Technical

- **FavoritesManager**: Updated `getTopFavorites()` to return up to 10 items instead of 5
- **Results Display**: Enhanced section generation to handle variable counts
- **CSS Compatibility**: Existing styles work seamlessly with additional items

## [0.6.0] - 2025-08-07

### Added: Additional Skip Options

### Added

- **Dislike Both Button**: New 👎 "Dislike Both" button to mark both designs as disliked
- **Can't Decide Button**: New 🤔 "Can't Decide - Show Later" button for neutral skipping
- **Visual Feedback**: Skip buttons provide immediate visual feedback when clicked
- **Smart Filtering**: Disliked designs are automatically filtered from future pairs
- **Enhanced UX**: Users now have more granular control over their preferences

### Enhanced

- **Skip Functionality**: Expanded beyond spacebar to include explicit button options
- **User Control**: Better handling of indecision vs. active dislike scenarios
- **Mobile Responsive**: Skip buttons adapt to mobile layouts with stacked design

### Technical

- **CSS Styling**: Added comprehensive styling for skip buttons with hover effects
- **JavaScript Integration**: New event handlers and feedback systems
- **Data Tracking**: Enhanced selection recording to include skip types
- **FavoritesManager Integration**: Leverages existing dislike tracking system

## [0.5.0] - 2025-08-05

### Added: Intelligent Dislike System

### Added

- **Dislike Tracking**: Automatically tracks rejected designs when users make choices
- **Smart Filtering**: Rejected designs are filtered out from future pairs to avoid showing them again
- **Persistent Learning**: Dislike data persists across sessions, creating a personalized experience
- **Rejection Statistics**: Track how many times designs have been rejected
- **Improved UX**: Users won't see designs they've already rejected, making choices more relevant

### Enhanced

- **Pair Generation**: Updated `getRandomPairs()` to filter out disliked designs
- **Data Loader**: Enhanced with `generatePairsFromDesigns()` method for flexible pair generation
- **Statistics**: Added dislike metrics to favorites statistics (totalDisliked, totalRejections)
- **Storage Management**: Dislike data integrated into localStorage with proper cleanup

### Technical

- **FavoritesManager**: Added `recordDislike()`, `isDisliked()`, `getDislikedDesigns()` methods
- **Selection Logic**: Updated `handleSelection()` to automatically record rejected designs as dislikes
- **Fallback Logic**: Graceful fallback when too many designs are disliked
- **Test Suite**: Comprehensive test file for dislike functionality

### User Experience

- **Smarter Recommendations**: App learns user preferences and avoids showing rejected designs
- **Faster Decision Making**: Users spend less time on designs they don't like
- **Personalized Experience**: Each user's experience becomes more tailored over time

## [0.4.6] - 2025-08-05

### Enhanced: Clean Website URLs

### Enhanced

- **Clean URLs**: Scraper now automatically removes `?ref=land-book.com` tracking parameters from website URLs
- **User-Friendly URLs**: Favorites section now displays clean URLs without tracking parameters
- **Better UX**: Users see clean, professional URLs like `https://everon.net/` instead of `https://everon.net/?ref=land-book.com`

### Added

- **URL Cleaning Function**: Added `cleanWebsiteUrl()` method to both main scrapers
- **Cleanup Script**: Created `clean-existing-urls.js` for cleaning existing data
- **URL Tests**: Added comprehensive test suite for URL cleaning functionality

### Technical

- **Scraper Enhancement**: Updated `json-scraper.js` and `scraper.js` to clean URLs during extraction
- **Backward Compatibility**: Existing data remains functional while new scrapes produce clean URLs
- **Validation**: Added proper URL parsing and error handling for malformed URLs

## [0.4.5] - 2025-08-05

### Fixed: Critical Data Validator Issue

### Fixed

- **Data Validator**: Fixed critical issue where `name` and `websiteUrl` fields were being stripped from design objects
- **Complete Data Flow**: Ensured all design data flows correctly from JSON → Validator → App → Favorites
- **Real URLs**: Favorites now display actual clickable website URLs instead of placeholder "#" links
- **Company Names**: Proper extraction of company names from design data
- **Favorites Display**: Fixed "Untitled Design" and "#" entries in favorites results

### Enhanced

- **Data Integrity**: Enhanced data validator to preserve all necessary fields (`name`, `websiteUrl`, `description`, `category`, `colors`, etc.)
- **Debug Tools**: Added comprehensive test and debug utilities for troubleshooting favorites issues
- **Error Handling**: Better validation and error reporting for malformed data

### Technical

- **Data Preservation**: Updated `validateAndCleanDesign` function to preserve complete design metadata
- **URL Validation**: Added proper URL validation for `websiteUrl` field
- **Debug Utilities**: Created debug tools for localStorage inspection and data migration

## [0.4.4] - 2025-08-05

### Fixed: Debug and Migration Tools

### Added

- **Debug Tools**: Added comprehensive debugging utilities for favorites troubleshooting
- **Migration Function**: Added metadata migration capability for fixing corrupted data
- **Console Helper**: Added `fixFavoritesData()` global function for easy data clearing

## [0.4.3] - 2025-08-05

### Fixed: Enhanced Debugging

### Added

- **Debug Logging**: Added comprehensive logging to identify data flow issues
- **Metadata Validation**: Enhanced metadata storage and retrieval validation
- **Error Reporting**: Better error messages for missing or corrupted favorites data

## [0.4.2] - 2025-08-05

### Fixed: Correct URL Usage

### Fixed

- **Website URLs**: Now correctly uses `websiteUrl` field from designs.json instead of generating fake URLs
- **Data Integrity**: Favorites now display actual website URLs from the data source
- **Simplified Logic**: Removed unnecessary URL extraction logic in favor of existing data

### Enhanced

- **Clean Title Extraction**: Simplified to `extractCleanTitle()` function for company names
- **Data Accuracy**: Favorites display real website URLs that users can actually visit
- **Test Updates**: Updated test files to match actual data structure

## [0.4.1] - 2025-08-05

### Fixed: Favorites Display Issues

### Fixed

- **Title and URL Display**: Fixed favorites showing "Untitled Design" and "undefined"
- **Data Structure Compatibility**: Updated favorites manager to work with actual design data structure
- **URL Extraction**: Improved extraction of company names and website URLs from design names
- **Clean Title Display**: Now properly extracts company name from pipe-separated design names

### Enhanced

- **URL Parsing**: Better domain detection and fallback URL generation
- **Helper Functions**: Added `extractTitleAndUrl()` helper for consistent data processing
- **Test Coverage**: Added URL extraction test file and debug utilities

## [0.4.0] - 2025-08-05

### Added: Favorites Tracking System

### Added

- **Favorites Manager**: Complete favorites tracking system with localStorage persistence
- **Selection Counting**: Automatic tracking of how many times each design is selected
- **Heart Bookmarking**: Heart button on each image for instant bookmarking
- **Top 5 Favorites**: Display of user's top 5 favorite designs in results
- **Favorites Statistics**: Comprehensive statistics about user preferences
- **Clear Favorites**: Option to clear all favorites data with confirmation
- **Cross-Session Persistence**: Favorites data persists across browser sessions
- **Round Robin Spec**: Added specification task for future round robin mode

### Enhanced

- **Results Display**: New favorites section showing top designs with selection counts
- **User Interface**: Heart buttons with smooth animations and visual feedback
- **Data Analysis**: Enhanced preference analysis including favorites scoring
- **Mobile Experience**: Responsive heart buttons optimized for touch devices

### Technical

- **FavoritesManager Module**: New `js/favorites-manager.js` with complete API
- **localStorage Integration**: Efficient storage and retrieval of favorites data
- **CSS Animations**: Smooth heart button animations and visual feedback
- **Test Suite**: Comprehensive test file for favorites functionality

## [1.3.0] - 2025-08-05

### Added: Rich Tag Data Integration

### Added

- **Rich Tag Data System**: Comprehensive tag categorization across 6 dimensions (style, industry, typography, type, platform, colors)
- **100 Enhanced Designs**: Scaled from 20 to 100 high-quality website designs with full metadata
- **Color Palette Extraction**: Automatic extraction of color palettes from each design (avg 10 colors per design)
- **JSON-Based Scraper**: New `json-scraper.js` for processing saved HTML files without live scraping
- **Enhanced Descriptions**: Contextual, meaningful descriptions generated for each design
- **Direct Website Links**: Links to actual websites for user inspiration
- **Sophisticated Analysis**: Deep preference tracking across multiple design dimensions

### Enhanced

- **Data Validator**: Updated to support relative image URLs alongside absolute URLs
- **Tag Categorization**: Intelligent categorization of 116+ unique tags into meaningful groups
- **User Experience**: Much richer preference analysis and recommendations
- **Performance**: Optimized data processing for larger datasets

### Technical

- Added `scraper/json-scraper.js` - Enhanced scraper with JSON input capability
- Added `scraper/test-json-scraper.js` - Comprehensive test suite
- Added `transform-enhanced-data.js` - Data transformation pipeline
- Added `rename-images.js` - Optional image filename cleanup utility
- Modified `js/data-validator.js` - Support for relative URLs
- Updated `data/designs.json` - 100 enhanced designs with categorized tags
- Added `data/images/` - Local image storage for all designs

### Data

- **116 unique tags** across all categories
- **100% designs with color palettes**
- **5 main categories**: Landing, Template, Ecommerce, Portfolio, Other
- **Enhanced metadata**: Author info, website URLs, detailed descriptions

### Breaking Changes

- None - Full backward compatibility maintained

## [1.2.0] - 2025-08-02

### Added

- **Direct URL Support**: Scrape any Land-book URL directly from browser with `--url` option
- **Lazy Loading**: Automatically trigger infinite scroll to load up to 100 items
- **Enhanced Scraping Capacity**: Increased default max items from 20 to 100
- **Browser-to-Scraper Workflow**: Copy any Land-book URL and scrape it directly

### Technical

- Added `triggerLazyLoading()` method for infinite scroll automation
- Enhanced `scrapeGridPage()` with automatic lazy loading triggers
- Added `--url` CLI option for direct URL input
- Modified URL handling to accept any Land-book URL format
- Created comprehensive test suite for new functionality
- Added respectful crawling delays between lazy loads

### Examples

```bash
# Direct URL scraping
npm run scrape -- --url "https://land-book.com/?search=life+coach" --max-items 50

# Test new functionality
node test-direct-url-lazy-loading.js
```

## [1.1.0] - 2025-08-02

### Added

- **Local Image Download**: Enhanced scraper to download images locally to `/data/images/` directory
- **Self-contained Application**: Eliminates external dependencies on Land-book CDN
- **Image Download CLI Option**: Added `--download-images` flag to scraper CLI
- **Automatic Directory Creation**: Scraper automatically creates images directory structure
- **Fallback Support**: Uses original URLs if local download fails

### Technical

- Added `downloadImage()` and `fetchImageBuffer()` methods to scraper
- Enhanced CLI with `--download-images` option
- Updated image path processing to use local paths when available
- Added comprehensive documentation and examples for image download feature
- Created test script for image download functionality

## [1.0.3] - 2025-08-02

### Fixed

- **Removed Fixed Positioning**: Eliminated jerky animation by removing fixed positioning from compact header
- **Simplified Animation**: Header now stays in normal document flow, only shrinks font size and reduces margins
- **Reduced Container Padding**: Changed `.app-container.header-compact` to use `padding-top: 10px` instead of 80px
- Much smoother, less disruptive header transformation

## [1.0.2] - 2025-08-02

### Fixed

- **Header Alignment**: Changed compact header to remain centered instead of left-aligned for smoother visual transition
- Improved overall header animation flow by maintaining consistent text alignment

## [1.0.1] - 2025-08-02

### Fixed

- **Improved Header Animation**: Enhanced the header transformation timing when clicking "Start Discovering"
  - Description now fades out and collapses in 200ms first
  - Header then transforms to compact mode with smooth font-size reduction and positioning
  - Added box shadow transition for better visual feedback
  - Implemented staged animation system for more polished user experience
- **Mobile Responsive Improvements**: Enhanced compact header sizing for different screen sizes

### Technical

- Added CSS animation stages with `stage-1` class for description fade-out
- Implemented JavaScript timing control with `setTimeout` for staged animations
- Updated transition timing functions for smoother visual flow
- Enhanced test file with staged animation demonstration

## [1.0.0] - 2025-08-02

### Added

- Initial release of This or That - Design Preference Discovery application
- Binary choice interface for design preference discovery
- 15-second timer system with visual progress indicators
- Progress tracking with session management (up to 3 sessions of 20 choices each)
- Comprehensive results analysis with preference categories
- Print/PDF export functionality for results
- Email sharing capabilities via EmailJS integration
- Mobile-responsive design with touch-friendly interface
- Enhanced error handling with retry mechanisms
- Performance optimizations including:
  - Image optimization with WebP support and compression
  - GPU-accelerated smooth animations and transitions
  - Memory usage monitoring and optimization
  - Connection-aware optimizations for slow networks
- Data validation and loading system with offline fallback support
- Land-book.com scraper tool for automated design data collection
- Comprehensive test suite with multiple test pages
- Cache management tools for development
- Keyboard navigation support (Arrow keys, Space key)
- Accessibility features including reduced motion support

### Features

- **Core Functionality**: Binary design choice system with timer-based progression
- **Progress System**: Multi-session support with milestone tracking
- **Results Engine**: Advanced preference analysis with visual charts and recommendations
- **Export Options**: Print-to-PDF and email sharing capabilities
- **Performance**: Optimized loading, smooth animations, and responsive design
- **Data Management**: Robust data loading with validation and error recovery
- **Developer Tools**: Comprehensive testing and debugging utilities

### Technical Implementation

- Modular JavaScript architecture with separate components for:
  - Application state management (`js/app.js`)
  - Timer system (`js/timer.js`)
  - Results analysis (`js/results.js`)
  - Data loading and validation (`js/app-data-loader.js`, `js/data-validator.js`)
  - Image optimization (`js/image-optimizer.js`)
  - Print functionality (`js/print.js`)
  - Email integration (`js/email.js`)
- Responsive CSS with mobile-first design approach
- Performance-optimized animations using CSS transforms and GPU acceleration
- Comprehensive error handling and user feedback systems
- Service worker implementation for offline support (disabled by default)

### Data Sources

- Primary: `data/designs.json` - Production design database
- Fallback: `data/sample-designs.json` - Development and offline fallback
- Automated collection via Land-book.com scraper tool

### Browser Support

- Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- Progressive enhancement for older browsers
- Mobile-optimized for iOS and Android devices

---

## Version Control Guidelines

This project follows [Semantic Versioning (SemVer)](https://semver.org/):

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR**: Incompatible API changes, major feature overhauls, breaking changes
- **MINOR**: New features, enhancements, non-breaking changes
- **PATCH**: Bug fixes, small improvements, security patches

### Examples

- `1.0.0` → `1.0.1`: Bug fix (timer not pausing correctly)
- `1.0.0` → `1.1.0`: New feature (dark mode support)
- `1.0.0` → `2.0.0`: Breaking change (complete UI redesign)

### Changelog Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

### Update Process

1. Make changes to the application
2. Update version number in `index.html` footer
3. Add entry to `CHANGELOG.md` with date and changes
4. Commit changes with descriptive message
5. Tag release if appropriate

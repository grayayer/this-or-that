# Changelog

All notable changes to the This or That application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Keyboard navigation support (1, 2, Space keys)
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

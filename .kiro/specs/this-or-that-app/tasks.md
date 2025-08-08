# Implementation Plan

## Version Control Guidelines

**IMPORTANT**: Every change to the application must include version control updates:

### 1. Update Version Number

- Update the version in `index.html` footer: `This or That v1.0.0`
- Follow Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`

### 2. Update Changelog

- Add entry to `CHANGELOG.md` with:
  - Version number and date
  - Category of changes (Added, Changed, Fixed, etc.)
  - Clear description of what was modified

### 3. Version Increment Rules

- **PATCH** (1.0.0 → 1.0.1): Bug fixes, small improvements
- **MINOR** (1.0.0 → 1.1.0): New features, enhancements
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes, major overhauls

### 4. Example Workflow

```
1. Fix timer pause bug
2. Update footer: v1.0.0 → v1.0.1
3. Add to CHANGELOG.md:
   ## [1.0.1] - 2025-08-02
   ### Fixed
   - Fixed timer not pausing during continue prompt
4. Commit with message: "fix: resolve timer pause issue (v1.0.1)"
```

---

# Implementation Plan

- [x] 1. Set up project structure and define data schema
  - Create directory structure with css/, js/, data/, scraper/, and assets/ folders
  - Define the design object schema with id, image, and tags structure
  - Create package.json for scraper with Puppeteer/Playwright dependencies
  - _Requirements: 6.1, 6.2_

- [-] 2. Build Land-book scraper tool for data collection
- [x] 2.1 Create basic scraper setup and navigation
  - Set up Puppeteer/Playwright with proper browser configuration
  - Implement navigation to Land-book category pages (e.g., health-and-fitness + light-colors)
  - Add logic to handle the 20-item limit per page for free accounts
  - _Requirements: 7.1, 10.5_

- [x] 2.2 Implement grid page scraping
  - Target websites grid with ID="websites" class="websites"
  - Extract website-item-wrapper elements from the grid
  - Collect thumbnail image URLs and detail page links from each item
  - Add error handling for missing elements or failed page loads
  - _Requirements: 7.1, 7.2_

- [x] 2.3 Build detail page data extraction
  - Navigate to individual website detail pages from collected links
  - Target div.website-content-sidebar for all taxonomy data extraction
  - Extract website name from H1 element within the sidebar
  - Extract website URL from anchor with "?ref=land-book.com" query parameter
  - Parse taxonomy sections (Category, Style, Industry, Type) from row elements with text-muted labels
  - Extract color hex codes from website-colors-item elements' background-color styles
  - Capture high-quality screenshot URLs from detail pages
  - Implement rate limiting and respectful crawling practices
  - _Requirements: 7.2, 7.3, 10.5_

- [x] 2.4 Create JSON output generation
  - Generate unique IDs for each scraped design
  - Format extracted data into the specified JSON structure
  - Implement data validation and cleanup for malformed tags
  - Output designs.json file ready for use by the web application
  - _Requirements: 7.4, 7.5_

- [x] 2.5 Add scraper configuration and documentation
  - Create configuration options for different Land-book categories and filters
  - Add command-line interface for running scraper with different parameters
  - Write comprehensive README with usage instructions
  - Implement logging and progress reporting during scraping
  - _Requirements: 7.1, 7.2_

- [x] 3. Create sample data and validate JSON structure
  - Create sample designs.json file with 10-15 test entries for development
  - Implement JSON validation and error handling for malformed data
  - Test data structure with various tag combinations and edge cases
  - _Requirements: 6.2, 6.3_

- [x] 4. Implement core application state management
  - Create app.js with appState object to track designs, selections, and progress
  - Build initializeApp() function to load JSON data and set up initial state
  - Implement error handling for JSON loading failures
  - _Requirements: 6.1, 6.3_

- [x] 5. Set up basic HTML foundation and styling
  - Build index.html with semantic structure for image pairs, timer, and results sections
  - Implement basic CSS reset and system font typography with white background
  - Create responsive layout structure for mobile and desktop
  - _Requirements: 6.1, 9.1_

- [x] 6. Build image pair selection and display system
  - Create loadNextPair() function with duplicate prevention logic
  - Implement image preloading and lazy loading mechanisms
  - Build responsive CSS for side-by-side image display
  - Add click handlers for image selection
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 7. Implement 30-second countdown timer component
  - Create timer.js with startTimer(), stopTimer(), and resetTimer() methods
  - Build visual progress bar with CSS animations
  - Implement automatic progression when timer expires
  - Add timer reset functionality when selection is made
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 8. Create progress tracking and display
  - Implement progress counter showing current choice number
  - Add visual progress indicator for completed choices
  - Display when minimum threshold (20 choices) is reached
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 9. Build selection handling and data recording
  - Create handleSelection() function to process user choices
  - Implement selection recording with timestamps and metadata
  - Add logic to advance to next pair after selection
  - Ensure proper state updates and progress tracking
  - _Requirements: 2.4, 3.1_

- [x] 9.1 Implement additional skip buttons functionality
  - Add "Dislike Both" button with 👎 emoji below image pairs
  - Add "Can't Decide - Show Later" button with 🤔 emoji below image pairs
  - Create handleDislikeBoth() function to record both designs as disliked
  - Create handleCannotDecide() function for neutral skipping (equivalent to spacebar)
  - Integrate with FavoritesManager to track disliked designs
  - Add visual feedback animations for button clicks
  - Update CSS styling for skip buttons with appropriate colors (red-tinted for dislike, neutral for can't decide)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 10. Implement results analysis engine
  - Create results.js with analyzeSelections() and calculateTagFrequencies() methods
  - Build tag frequency analysis across all categories (style, industry, typography, etc.)
  - Implement generateProfile() to create ranked preference lists
  - Add formatResults() for display-ready data structure
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 11. Create results display interface
  - Build dynamic results content generation in results.js
  - Implement CSS styling for ranked tag lists and design profile
  - Replace placeholder results section with actual analysis display
  - Add visual charts or graphs for preference breakdown
  - _Requirements: 4.3, 4.4, 4.5, 10.3_

- [x] 12. Implement email functionality for results sharing
  - Set up EmailJS or Formspree integration for client-side email sending
  - Create email.js with sendResults() and formatEmailContent() methods
  - Connect email form handlers to actual email service
  - Implement professional email template formatting
  - Add success/error feedback for email sending
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 13. Enhance mobile responsiveness and touch interactions
  - Review and improve responsive CSS for mobile devices
  - Add touch event handlers for better mobile image selection
  - Optimize timer and progress display for small screens
  - Test and refine mobile user experience across devices
  - _Requirements: 9.1, 9.4_

- [x] 14. Enhance error handling and loading states
  - Improve loading states for JSON data and image loading (already partially implemented)
  - Add retry logic for failed operations
  - Enhance user-friendly error messages for network issues
  - Add graceful degradation for offline scenarios
  - _Requirements: 1.4, 6.3_

- [x] 15. Add performance optimizations
  - Implement image compression and WebP format support
  - Add service worker for caching static assets
  - Optimize JavaScript bundle size and loading
  - Implement smooth transitions and animations
  - _Requirements: 9.2, 9.3_

- [x] 16. Create comprehensive test suite
  - Expand existing test files to cover edge cases
  - Test results analysis algorithms with various data sets
  - Create integration tests for end-to-end user flow
  - _Requirements: All requirements validation_

- [ ] 17. Expand the data set for the app
  - Create larger data.json file, with at least 200 entries
  - use the file data/2220-land-book-web-designs.html as the reference for this, with images likely already downloaded to the folder landingpage-full/Landbook - website design inspiration gallery_files/
  - scrape the links for each entry so that the tags (such as color, typography, style, industry, etc) are also saved to the data.json file.
  - if image files aren't already downloaded, download them so that the app loads the images locally rather than from land-book.com, which could violate CORS
  - _Requirements: All requirements validation_

- [ ] 18. Implement Round Robin Favorites Mode
  - Create optional "Round Robin" selection mode that pits only favorite designs against each other
  - Add toggle button in results section to switch to round robin mode
  - Filter designs to only show those with 2+ selections or heart bookmarks
  - Implement separate round robin session with its own progress tracking
  - Allow users to further refine their top preferences through head-to-head comparisons
  - Add results comparison between regular mode and round robin mode preferences
  - _Requirements: Enhanced user preference refinement_

- [ ] 19. Final integration and deployment preparation
  - Integrate all components and test complete user flow
  - Optimize for static site hosting (Netlify/Vercel/GitHub Pages)
  - Configure Content Security Policy and security headers
  - Prepare production build with minification
  - Test with real Land-book data from scraper
  - _Requirements: 8.1, 8.2, 8.3, 10.1, 10.2, 10.4, 10.5_

# Requirements Document

## Introduction

The "This or That?" application is a client-facing web tool designed to help users clarify their aesthetic preferences for web design through a series of quick binary choices. Users are presented with pairs of web design screenshots from Land-book.com and must choose their preferred option within a 30-second time limit. After completing at least 20 choices, the application generates a design direction profile based on the most frequently selected design tags, providing valuable insights into the user's aesthetic preferences.

## Requirements

### Requirement 1

**User Story:** As a user, I want to see two web design screenshots side by side, so that I can quickly compare and choose my preferred aesthetic.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display two different web design screenshots side by side
2. WHEN displaying screenshots THEN the system SHALL ensure no duplicate pairings occur during a session
3. WHEN screenshots are displayed THEN the system SHALL load images from the JSON data source
4. IF an image fails to load THEN the system SHALL skip to the next available pair

### Requirement 2

**User Story:** As a user, I want to make quick selections with a time limit, so that I rely on my instinctive preferences rather than overthinking.

#### Acceptance Criteria

1. WHEN a new pair is displayed THEN the system SHALL start a 30-second countdown timer
2. WHEN the timer is active THEN the system SHALL display a visual progress bar at the top or bottom of the screen
3. WHEN the timer expires AND no selection is made THEN the system SHALL automatically advance to the next pair
4. WHEN a user clicks on either option THEN the system SHALL immediately record the selection and advance to the next pair
5. WHEN a selection is made THEN the system SHALL reset the timer for the next pair

### Requirement 3

**User Story:** As a user, I want to track my progress through the selection process, so that I know how many choices I've made and how many remain.

#### Acceptance Criteria

1. WHEN making selections THEN the system SHALL display a progress indicator showing current choice number
2. WHEN the progress updates THEN the system SHALL show the total number of choices completed
3. WHEN approaching the minimum threshold THEN the system SHALL indicate when results will be available
4. WHEN 20 choices are completed THEN the system SHALL ask the user if they'd like to do another 20. If not, then enable access to results. If so, repeat the process up to 2 more times.

### Requirement 4

**User Story:** As a user, I want to see my design preference results after completing sufficient choices, so that I can understand my aesthetic preferences.

#### Acceptance Criteria

1. WHEN at least 20 choices are completed THEN the system SHALL generate a results summary
2. WHEN generating results THEN the system SHALL analyze tags from all selected images
3. WHEN displaying results THEN the system SHALL show ranked lists of preferred tags by category (style, industry, typography, type, platform, colors)
4. WHEN showing tag rankings THEN the system SHALL display the most frequently chosen tags first
5. WHEN results are available THEN the system SHALL provide a clear design direction profile

### Requirement 5

**User Story:** As a user, I want to email my results to myself and my designer, so that I can share my design preferences for collaboration.

#### Acceptance Criteria

1. WHEN viewing results THEN the system SHALL provide an option to email the results
2. WHEN sending email THEN the system SHALL allow entry of user's email address
3. WHEN sending email THEN the system SHALL allow entry of designer's email address (optional)
4. WHEN email is sent THEN the system SHALL include the complete design preference profile
5. WHEN email is sent THEN the system SHALL format results in a professional, readable format
6. WHEN email fails to send THEN the system SHALL display an appropriate error message
7. WHEN email is successful THEN the system SHALL confirm delivery to the user

### Requirement 6

**User Story:** As a developer, I want the application to load content from a JSON file, so that I can easily update design options without code changes.

#### Acceptance Criteria

1. WHEN the application initializes THEN the system SHALL load image data from a local JSON file
2. WHEN loading JSON data THEN the system SHALL parse image metadata including URLs and tag associations
3. WHEN JSON structure is invalid THEN the system SHALL display an appropriate error message
4. WHEN new JSON data is deployed THEN the system SHALL reflect changes without code modifications

### Requirement 7

**User Story:** As a developer, I want a scraper tool to collect Land-book data, so that I can populate the JSON file with current design examples.

#### Acceptance Criteria

1. WHEN running the scraper THEN the system SHALL extract screenshot URLs from Land-book detail pages
2. WHEN scraping pages THEN the system SHALL collect all available tags (style, industry, typography, type, category, platform, colors)
3. WHEN scraping is complete THEN the system SHALL output data in the specified JSON format
4. WHEN generating JSON THEN the system SHALL include unique IDs for each design entry
5. WHEN extracting colors THEN the system SHALL capture hex color codes when available

### Requirement 8

**User Story:** As a user, I want the application to work without requiring login or registration, so that I can use it immediately without barriers.

#### Acceptance Criteria

1. WHEN accessing the application THEN the system SHALL function without user authentication
2. WHEN using the application THEN the system SHALL not require personal information
3. WHEN session ends THEN the system SHALL not persist user data beyond the current session
4. WHEN starting a new session THEN the system SHALL begin with a fresh set of choices

### Requirement 9

**User Story:** As a user, I want the application to be responsive and fast, so that I can use it effectively on any device.

#### Acceptance Criteria

1. WHEN accessing on mobile devices THEN the system SHALL display screenshots in a mobile-friendly layout
2. WHEN loading images THEN the system SHALL optimize for quick display times
3. WHEN switching between pairs THEN the system SHALL provide smooth transitions
4. WHEN using touch devices THEN the system SHALL support touch interactions for selections

### Requirement 10

**User Story:** As a user, I want to know that my privacy is protected and content is ethically sourced, so that I can use the application with confidence.

#### Acceptance Criteria

1. WHEN using the application THEN the system SHALL only use publicly visible thumbnails from Land-book.com
2. WHEN collecting user interactions THEN the system SHALL not collect or store any personal data
3. WHEN displaying results THEN the system SHALL include a credit link to Land-book.com
4. WHEN session ends THEN the system SHALL not retain any user preference data
5. WHEN scraping content THEN the system SHALL respect Land-book.com's terms of service and robots.txt

/**
 * Core Application State Management
 * Main controller for the "This or That?" web design preference application
 */

/**
 * Global application state object
 * Tracks designs, user selections, and progress through the application
 */
const appState = {
	// Core data
	designs: [],                    // All loaded design data from JSON
	currentPair: [],               // Current two images being shown [design1, design2]
	usedPairs: new Set(),          // Track shown pairs to avoid duplicates (format: "id1|id2")

	// User progress and selections
	selections: [],                // Array of user choices with metadata
	currentRound: 0,               // Current choice number (0-based)
	totalRounds: 0,                // Total rounds completed
	minChoicesRequired: 20,        // Minimum choices before results available
	maxRoundsPerSession: 20,       // Maximum rounds per session before asking to continue
	currentSession: 1,             // Current session number (1-3 max)
	maxSessions: 3,                // Maximum number of sessions allowed

	// Application status
	isInitialized: false,          // Whether app has been initialized
	isComplete: false,             // Whether minimum choices reached and results available
	isLoading: false,              // Loading state for UI feedback
	error: null,                   // Current error state, if any

	// Data loader instance
	dataLoader: null,              // AppDataLoader instance

	// Configuration
	config: {
		dataPath: 'data/designs.json',     // Primary data source
		fallbackDataPath: 'data/sample-designs.json',  // Fallback for development
		timerDuration: 15,                  // Timer duration in seconds
		enableLogging: true                 // Enable console logging
	}
};

/**
 * Initializes the application by loading JSON data and setting up initial state
 * @param {Object} options - Configuration options
 * @param {string} options.dataPath - Path to JSON data file
 * @param {string} options.fallbackPath - Fallback data path
 * @param {boolean} options.enableLogging - Enable console logging
 * @returns {Promise<boolean>} - Promise resolving to true if successful
 */
async function initializeApp(options = {}) {
	try {
		// Update configuration with provided options
		appState.config = {
			...appState.config,
			...options
		};

		appState.isLoading = true;
		appState.error = null;

		if (appState.config.enableLogging) {
			console.log('🚀 Initializing This or That application...');
		}

		// Initialize data loader with fallback approach
		if (typeof AppDataLoader === 'undefined') {
			throw new Error('AppDataLoader not available. Make sure app-data-loader.js is loaded first.');
		}

		console.log('🔧 Creating AppDataLoader instance...');
		appState.dataLoader = new AppDataLoader();

		// Debug: Check available methods
		const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(appState.dataLoader));
		console.log('Available AppDataLoader methods:', availableMethods);

		// Check if the method exists, if not use fallback
		const hasOfflineSupport = typeof appState.dataLoader.loadDesignsWithOfflineSupport === 'function';
		const hasBasicLoad = typeof appState.dataLoader.loadDesigns === 'function';

		console.log('loadDesignsWithOfflineSupport available:', hasOfflineSupport);
		console.log('loadDesigns available:', hasBasicLoad);

		if (!hasOfflineSupport && !hasBasicLoad) {
			throw new Error('No data loading methods available in AppDataLoader');
		}

		console.log('✅ AppDataLoader instance created successfully');

		// Show loading state
		showLoadingState('Initializing application...');

		// Set up progress callback for loading feedback
		const onProgress = (progressInfo) => {
			if (progressInfo.stage === 'loading') {
				showLoadingState(`Loading design data... (${progressInfo.attempt}/${progressInfo.maxRetries})`);
			} else if (progressInfo.stage === 'parsing') {
				showLoadingState('Validating design data...');
			} else if (progressInfo.stage === 'error') {
				showLoadingState(`Retry ${progressInfo.attempt}: ${progressInfo.message}`);
			} else if (progressInfo.stage === 'cache') {
				showLoadingState('Loading from offline cache...');
			}
		};

		// Try to load primary data source with fallback method support
		let loadedData = null;

		// Choose the appropriate loading method
		const loadMethod = typeof appState.dataLoader.loadDesignsWithOfflineSupport === 'function'
			? 'loadDesignsWithOfflineSupport'
			: 'loadDesigns';

		console.log(`🔄 Using ${loadMethod} method for data loading`);

		try {
			loadedData = await appState.dataLoader[loadMethod](
				appState.config.dataPath,
				{
					maxRetries: 3,
					retryDelay: 1000,
					onProgress
				}
			);
			if (appState.config.enableLogging) {
				console.log(`✅ Loaded data from ${appState.config.dataPath}`);
			}
		} catch (primaryError) {
			if (appState.config.enableLogging) {
				console.warn(`⚠️ Failed to load ${appState.config.dataPath}, trying fallback...`);
			}

			showLoadingState('Trying fallback data source...');

			try {
				loadedData = await appState.dataLoader[loadMethod](
					appState.config.fallbackDataPath,
					{
						maxRetries: 2,
						retryDelay: 500,
						onProgress
					}
				);
				if (appState.config.enableLogging) {
					console.log(`✅ Loaded fallback data from ${appState.config.fallbackDataPath}`);
				}
			} catch (fallbackError) {
				// Create comprehensive error message
				const errorDetails = {
					primaryError: primaryError.message,
					fallbackError: fallbackError.message,
					isOffline: typeof navigator !== 'undefined' && !navigator.onLine,
					timestamp: new Date().toISOString()
				};

				const userFriendlyMessage = createUserFriendlyErrorMessage(errorDetails);
				throw new Error(userFriendlyMessage);
			}
		}

		// Validate loaded data
		if (!loadedData || !loadedData.designs || !Array.isArray(loadedData.designs)) {
			throw new Error('Invalid data structure: missing designs array');
		}

		if (loadedData.designs.length < 2) {
			throw new Error(`Insufficient data: need at least 2 designs, got ${loadedData.designs.length}`);
		}

		// Store designs in app state
		appState.designs = loadedData.designs;

		// Reset state for new session
		resetApplicationState();

		// Mark as initialized
		appState.isInitialized = true;
		appState.isLoading = false;

		if (appState.config.enableLogging) {
			console.log(`🎉 Application initialized successfully with ${appState.designs.length} designs`);

			// Log data statistics
			const stats = appState.dataLoader.getDataStats();
			if (stats) {
				console.log('📊 Data Statistics:');
				console.log(`   - Total designs: ${stats.totalDesigns}`);
				console.log(`   - Unique style tags: ${stats.tagStats.style?.unique || 0}`);
				console.log(`   - Unique industry tags: ${stats.tagStats.industry?.unique || 0}`);
				console.log(`   - Average colors per design: ${stats.averageColorsPerDesign?.toFixed(1) || 0}`);
			}
		}

		return true;

	} catch (error) {
		appState.error = error.message;
		appState.isLoading = false;
		appState.isInitialized = false;

		if (appState.config.enableLogging) {
			console.error('❌ Failed to initialize application:', error.message);
		}

		// Re-throw error for caller to handle
		throw error;
	}
}

/**
 * Resets the application state for a new session
 * Preserves loaded data but clears user progress
 */
function resetApplicationState() {
	appState.currentPair = [];
	appState.usedPairs.clear();
	appState.selections = [];
	appState.currentRound = 0;
	appState.totalRounds = 0;
	appState.currentSession = 1;
	appState.isComplete = false;
	appState.error = null;

	if (appState.config.enableLogging) {
		console.log('🔄 Application state reset for new session');
	}
}

/**
 * Gets the current application state
 * @returns {Object} - Copy of current app state (read-only)
 */
function getAppState() {
	// Return a copy to prevent external modification
	return {
		...appState,
		// Deep copy arrays and objects that might be modified
		designs: [...appState.designs],
		currentPair: [...appState.currentPair],
		selections: [...appState.selections],
		usedPairs: new Set(appState.usedPairs),
		config: { ...appState.config }
	};
}

/**
 * Checks if the application is ready for use
 * @returns {boolean} - True if initialized and has sufficient data
 */
function isAppReady() {
	return appState.isInitialized &&
		appState.designs.length >= 2 &&
		!appState.isLoading &&
		!appState.error;
}

/**
 * Gets application statistics and status
 * @returns {Object} - Status information
 */
function getAppStatus() {
	return {
		isInitialized: appState.isInitialized,
		isReady: isAppReady(),
		isLoading: appState.isLoading,
		isComplete: appState.isComplete,
		error: appState.error,
		designCount: appState.designs.length,
		currentRound: appState.currentRound,
		totalRounds: appState.totalRounds,
		currentSession: appState.currentSession,
		maxSessions: appState.maxSessions,
		minChoicesRequired: appState.minChoicesRequired,
		progressPercentage: Math.min(100, (appState.totalRounds / appState.minChoicesRequired) * 100),
		canShowResults: appState.totalRounds >= appState.minChoicesRequired,
		remainingChoices: Math.max(0, appState.minChoicesRequired - appState.totalRounds)
	};
}

/**
 * Validates that required dependencies are available
 * @returns {Object} - Validation result with missing dependencies
 */
function validateDependencies() {
	const missing = [];
	const warnings = [];

	if (typeof AppDataLoader === 'undefined') {
		missing.push('AppDataLoader (app-data-loader.js)');
	}

	if (typeof DataValidator === 'undefined') {
		warnings.push('DataValidator (data-validator.js) - may affect data validation');
	}

	// Check for fetch API support
	if (typeof fetch === 'undefined') {
		missing.push('Fetch API - required for loading JSON data');
	}

	return {
		isValid: missing.length === 0,
		missing,
		warnings
	};
}

/**
 * Handles application errors with appropriate logging and state updates
 * @param {Error|string} error - Error to handle
 * @param {string} context - Context where error occurred
 */
function handleAppError(error, context = 'Unknown') {
	const errorMessage = error instanceof Error ? error.message : String(error);

	appState.error = errorMessage;
	appState.isLoading = false;

	if (appState.config.enableLogging) {
		console.error(`❌ Application error in ${context}:`, errorMessage);
	}

	// Emit custom event for UI to handle
	if (typeof window !== 'undefined' && window.dispatchEvent) {
		window.dispatchEvent(new CustomEvent('appError', {
			detail: { error: errorMessage, context }
		}));
	}
}

/**
 * Clears the current error state
 */
function clearAppError() {
	appState.error = null;
}

/**
 * Creates user-friendly error messages based on error details
 * @param {Object} errorDetails - Details about the error
 * @returns {string} - User-friendly error message
 */
function createUserFriendlyErrorMessage(errorDetails) {
	const { primaryError, fallbackError, isOffline } = errorDetails;

	if (isOffline) {
		return 'You appear to be offline. Please check your internet connection and try again. If you\'ve used this app before, some data may be available from cache.';
	}

	// Check for common error patterns
	if (primaryError.includes('404') || fallbackError.includes('404')) {
		return 'The design data files could not be found. This might be a temporary issue with the server. Please try refreshing the page in a few minutes.';
	}

	if (primaryError.includes('timeout') || fallbackError.includes('timeout')) {
		return 'The request timed out while loading design data. This might be due to a slow connection. Please check your internet connection and try again.';
	}

	if (primaryError.includes('validation failed') || fallbackError.includes('validation failed')) {
		return 'There was an issue with the design data format. Please try refreshing the page. If the problem persists, this may be a temporary server issue.';
	}

	if (primaryError.includes('server error') || fallbackError.includes('server error')) {
		return 'The server is experiencing issues. Please try again in a few minutes. If the problem persists, you can try refreshing the page.';
	}

	// Generic network error
	return 'Unable to load design data due to a network issue. Please check your internet connection and try refreshing the page. If you\'ve used this app before, some data may be available offline.';
}

/**
 * Shows loading state with custom message
 * @param {string} message - Loading message to display
 */
function showLoadingState(message = 'Loading...') {
	const loadingSection = document.getElementById('loading-section');
	const loadingText = document.querySelector('.loading-text');
	const selectionSection = document.getElementById('selection-section');
	const errorSection = document.getElementById('error-section');

	if (loadingSection) {
		loadingSection.style.display = 'block';
	}

	if (loadingText) {
		loadingText.textContent = message;
	}

	if (selectionSection) {
		selectionSection.style.display = 'none';
	}

	if (errorSection) {
		errorSection.style.display = 'none';
	}
}

/**
 * Hides loading state
 */
function hideLoadingState() {
	const loadingSection = document.getElementById('loading-section');
	if (loadingSection) {
		loadingSection.style.display = 'none';
	}
}

/**
 * Hides error state and clears error messages
 */
function hideErrorState() {
	const errorSection = document.getElementById('error-section');
	if (errorSection) {
		errorSection.style.display = 'none';
		errorSection.innerHTML = ''; // Clear any previous error content
	}

	// Clear app error state
	clearAppError();
}

/**
 * Shows the selection section when app is ready
 */
function showSelectionSection() {
	const selectionSection = document.getElementById('selection-section');
	const loadingSection = document.getElementById('loading-section');
	const errorSection = document.getElementById('error-section');
	const instructionsSection = document.getElementById('instructions-section');

	// Hide other sections
	if (loadingSection) loadingSection.style.display = 'none';
	if (errorSection) errorSection.style.display = 'none';
	if (instructionsSection) instructionsSection.style.display = 'none';

	// Show selection section
	if (selectionSection) {
		selectionSection.style.display = 'block';
		selectionSection.classList.remove('hidden', 'loading');
	}
}

/**
 * Clears all UI states and resets to initial state
 */
function clearAllUIStates() {
	// Hide all sections initially
	const sections = [
		'loading-section',
		'error-section',
		'selection-section',
		'results-section',
		'email-section',
		'continue-section'
	];

	sections.forEach(sectionId => {
		const section = document.getElementById(sectionId);
		if (section) {
			section.style.display = 'none';
			// Clear any dynamic content but preserve original structure
			if (sectionId === 'error-section') {
				section.innerHTML = `
					<div class="error-container">
						<h3>Oops! Something went wrong</h3>
						<p class="error-message" id="error-message"></p>
						<button class="btn btn-primary" id="retry-btn">Try Again</button>
					</div>
				`;
			}
		}
	});

	// Show instructions section by default
	const instructionsSection = document.getElementById('instructions-section');
	if (instructionsSection) {
		instructionsSection.style.display = 'block';
	}

	// Clear any error messages
	clearAppError();

	console.log('🧹 All UI states cleared');
}

/**
 * Shows enhanced error state with retry options
 * @param {string} errorMessage - Error message to display
 * @param {Object} options - Error display options
 */
function showEnhancedErrorState(errorMessage, options = {}) {
	const {
		showRetryButton = true,
		showRefreshButton = true,
		showOfflineMessage = false,
		retryCallback = null
	} = options;

	const errorSection = document.getElementById('error-section');
	const errorMessageElement = document.getElementById('error-message');
	const loadingSection = document.getElementById('loading-section');
	const selectionSection = document.getElementById('selection-section');

	if (!errorSection || !errorMessageElement) {
		console.error('❌ Error section elements not found');
		return;
	}

	// Hide other sections
	if (loadingSection) loadingSection.style.display = 'none';
	if (selectionSection) selectionSection.style.display = 'none';

	// Create enhanced error content (don't duplicate the message)
	let errorHTML = `
		<div class="error-container">
			<h3>Oops! Something went wrong</h3>
			<p class="error-message">${errorMessage}</p>
	`;

	if (showOfflineMessage) {
		errorHTML += `
			<div class="offline-notice">
				<p><strong>💡 Offline Mode:</strong> You can still use cached data if available.</p>
			</div>
		`;
	}

	errorHTML += '<div class="error-actions">';

	if (showRetryButton) {
		errorHTML += '<button class="btn btn-primary" id="retry-btn">Try Again</button>';
	}

	if (showRefreshButton) {
		errorHTML += '<button class="btn btn-secondary" id="refresh-btn">Refresh Page</button>';
	}

	errorHTML += `
			</div>
			<div class="error-details">
				<details>
					<summary>Technical Details</summary>
					<p>If this problem persists, you can:</p>
					<ul>
						<li>Check your internet connection</li>
						<li>Try refreshing the page</li>
						<li>Clear your browser cache</li>
						<li>Try again in a few minutes</li>
					</ul>
				</details>
			</div>
		</div>
	`;

	errorSection.innerHTML = errorHTML;

	// Set up event listeners
	const retryBtn = errorSection.querySelector('#retry-btn');
	const refreshBtn = errorSection.querySelector('#refresh-btn');

	if (retryBtn) {
		retryBtn.addEventListener('click', () => {
			if (retryCallback) {
				retryCallback();
			} else {
				location.reload();
			}
		});
	}

	if (refreshBtn) {
		refreshBtn.addEventListener('click', () => {
			location.reload();
		});
	}

	// Show error section
	errorSection.style.display = 'block';
}

/**
 * Loads the next pair of images for user selection
 * Implements duplicate prevention logic and ensures variety
 * @returns {boolean} - True if pair loaded successfully, false otherwise
 */
function loadNextPair() {
	try {
		if (!isAppReady()) {
			console.error('❌ App not ready for loading pairs');
			return false;
		}

		if (appState.config.enableLogging) {
			console.log(`🔄 Loading next pair (round ${appState.currentRound + 1})`);
		}

		// Get a new pair using the data loader
		const pairs = appState.dataLoader.getRandomPairs(1, appState.usedPairs);

		if (pairs.length === 0) {
			console.warn('⚠️ No more unique pairs available');
			// If we've exhausted all pairs, reset used pairs and try again
			if (appState.usedPairs.size > 0) {
				appState.usedPairs.clear();
				const retryPairs = appState.dataLoader.getRandomPairs(1, appState.usedPairs);
				if (retryPairs.length > 0) {
					appState.currentPair = retryPairs[0];
				} else {
					return false;
				}
			} else {
				return false;
			}
		} else {
			appState.currentPair = pairs[0];
		}

		// Update UI with new pair
		displayImagePair(appState.currentPair);

		// Preload next images in background
		preloadNextImages();

		// Start timer for the new pair (requirement 2.1)
		if (typeof startTimer === 'function') {
			setTimeout(() => {
				startTimer();
			}, 500); // Small delay to let images load
		}

		if (appState.config.enableLogging) {
			console.log(`✅ Loaded pair: ${appState.currentPair[0].id} vs ${appState.currentPair[1].id}`);
		}

		return true;

	} catch (error) {
		handleAppError(error, 'loadNextPair');
		return false;
	}
}

/**
 * Displays the current image pair in the UI
 * @param {Array} pair - Array of two design objects
 */
function displayImagePair(pair) {
	if (!pair || pair.length !== 2) {
		console.error('❌ Invalid pair provided to displayImagePair');
		return;
	}

	const image1Element = document.getElementById('image-1');
	const image2Element = document.getElementById('image-2');
	const option1Element = document.getElementById('image-option-1');
	const option2Element = document.getElementById('image-option-2');

	if (!image1Element || !image2Element || !option1Element || !option2Element) {
		console.error('❌ Required image elements not found in DOM');
		return;
	}

	// Set up first image
	setupImageElement(image1Element, pair[0], option1Element);

	// Set up second image
	setupImageElement(image2Element, pair[1], option2Element);

	// Show selection section and hide loading
	showSelectionSection();
}

/**
 * Sets up an individual image element with enhanced loading states and error handling
 * @param {HTMLImageElement} imgElement - The image element
 * @param {Object} design - The design object
 * @param {HTMLElement} containerElement - The container element
 */
function setupImageElement(imgElement, design, containerElement) {
	// Store design ID on container for click handling
	containerElement.dataset.designId = design.id;

	// Add loading class with smooth transition
	containerElement.classList.add('loading');
	containerElement.classList.remove('loaded', 'error');
	imgElement.classList.add('loading');

	// Create loading timeout
	const loadingTimeout = setTimeout(() => {
		if (containerElement.classList.contains('loading')) {
			console.warn(`⚠️ Image loading timeout for: ${design.id}`);
			handleImageError(imgElement, design, containerElement, 'Loading timeout');
		}
	}, 15000); // 15 second timeout

	// Set up image load handlers with retry logic
	let retryCount = 0;
	const maxRetries = 2;

	const attemptLoad = (imageUrl, attempt = 1) => {
		if (appState.config.enableLogging && attempt > 1) {
			console.log(`🔄 Retrying image load: ${design.id} (attempt ${attempt})`);
		}

		imgElement.onload = () => {
			clearTimeout(loadingTimeout);

			// Smooth loading transition
			containerElement.classList.remove('loading');
			containerElement.classList.add('loaded');
			imgElement.classList.remove('loading');
			imgElement.classList.add('loaded');

			if (appState.config.enableLogging) {
				console.log(`✅ Image loaded: ${design.id}${attempt > 1 ? ` (after ${attempt} attempts)` : ''}`);
			}
		};

		imgElement.onerror = () => {
			clearTimeout(loadingTimeout);

			if (attempt < maxRetries) {
				// Try again with cache-busting parameter
				const retryUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + `retry=${attempt}&t=${Date.now()}`;
				setTimeout(() => {
					attemptLoad(retryUrl, attempt + 1);
				}, 1000 * attempt); // Exponential backoff
			} else {
				handleImageError(imgElement, design, containerElement, 'Failed to load after retries');
			}
		};

		// Optimize image URL using image optimizer if available
		let optimizedUrl = imageUrl;
		if (typeof imageOptimizer !== 'undefined') {
			optimizedUrl = imageOptimizer.optimizeImageUrl(imageUrl, {
				width: 800,
				quality: 0.85,
				format: 'auto'
			});
		}

		// Set image source
		imgElement.src = optimizedUrl;
	};

	// Start loading attempt
	attemptLoad(design.image);

	// Set alt text
	imgElement.alt = design.title || `Design option ${design.id}`;
}

/**
 * Handles image loading errors with fallback options
 * @param {HTMLImageElement} imgElement - The image element
 * @param {Object} design - The design object
 * @param {HTMLElement} containerElement - The container element
 * @param {string} errorReason - Reason for the error
 */
function handleImageError(imgElement, design, containerElement, errorReason) {
	containerElement.classList.remove('loading');
	containerElement.classList.add('error');

	// Create a more informative placeholder
	const placeholderSvg = createImagePlaceholder(design.id, errorReason);
	imgElement.src = placeholderSvg;
	imgElement.alt = `Design ${design.id} - Image unavailable (${errorReason})`;

	// Add retry button to container
	addImageRetryButton(containerElement, design, imgElement);

	console.warn(`⚠️ Image error for ${design.id}: ${errorReason}`);
}

/**
 * Creates an SVG placeholder for failed images
 * @param {string} designId - Design ID
 * @param {string} errorReason - Error reason
 * @returns {string} - Data URL for SVG placeholder
 */
function createImagePlaceholder(designId, errorReason) {
	const svg = `
		<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
			<rect width="100%" height="100%" fill="#f8f9fa" stroke="#e9ecef" stroke-width="2"/>
			<text x="50%" y="40%" font-family="Arial, sans-serif" font-size="16" fill="#666666" text-anchor="middle" dy=".3em">
				Image Unavailable
			</text>
			<text x="50%" y="55%" font-family="Arial, sans-serif" font-size="12" fill="#999999" text-anchor="middle" dy=".3em">
				Design: ${designId}
			</text>
			<text x="50%" y="70%" font-family="Arial, sans-serif" font-size="10" fill="#999999" text-anchor="middle" dy=".3em">
				${errorReason}
			</text>
			<circle cx="200" cy="120" r="20" fill="none" stroke="#ccc" stroke-width="2"/>
			<path d="M190 120 L200 130 L210 110" stroke="#ccc" stroke-width="2" fill="none"/>
		</svg>
	`;

	return 'data:image/svg+xml;base64,' + btoa(svg);
}

/**
 * Adds a retry button to failed image containers
 * @param {HTMLElement} containerElement - The container element
 * @param {Object} design - The design object
 * @param {HTMLImageElement} imgElement - The image element
 */
function addImageRetryButton(containerElement, design, imgElement) {
	// Remove existing retry button if present
	const existingButton = containerElement.querySelector('.image-retry-btn');
	if (existingButton) {
		existingButton.remove();
	}

	// Create retry button
	const retryButton = document.createElement('button');
	retryButton.className = 'image-retry-btn';
	retryButton.innerHTML = '🔄 Retry';
	retryButton.title = 'Click to retry loading this image';

	retryButton.addEventListener('click', (e) => {
		e.stopPropagation(); // Prevent image selection
		retryButton.remove();
		setupImageElement(imgElement, design, containerElement);
	});

	// Add button to container
	containerElement.appendChild(retryButton);
}

/**
 * Preloads the next set of images in the background for better performance
 */
function preloadNextImages() {
	try {
		// Get next potential pairs for preloading
		const nextPairs = appState.dataLoader.getRandomPairs(2, appState.usedPairs);

		// Use image optimizer for preloading if available
		if (typeof imageOptimizer !== 'undefined') {
			const imageUrls = nextPairs.flat().map(design => design.image);
			imageOptimizer.preloadImages(imageUrls, {
				priority: 'low',
				timeout: 8000
			}).then(results => {
				const successful = results.filter(result => result.status === 'fulfilled').length;
				if (appState.config.enableLogging && successful > 0) {
					console.log(`🔄 Preloaded ${successful} optimized images`);
				}
			});
		} else {
			// Fallback to basic preloading
			nextPairs.forEach(pair => {
				pair.forEach(design => {
					const img = new Image();
					img.src = design.image;
					// Images will be cached by browser for faster loading
				});
			});

			if (appState.config.enableLogging && nextPairs.length > 0) {
				console.log(`🔄 Preloaded ${nextPairs.length * 2} images`);
			}
		}
	} catch (error) {
		// Preloading failure shouldn't break the app
		console.warn('⚠️ Failed to preload images:', error.message);
	}
}

/**
 * Handles user selection of an image
 * Implements requirements 2.4 (record selection and advance) and 3.1 (progress tracking)
 * @param {string} selectedDesignId - ID of the selected design
 */
function handleSelection(selectedDesignId) {
	try {
		if (!appState.currentPair || appState.currentPair.length !== 2) {
			console.error('❌ No current pair available for selection');
			return false;
		}

		const selectedDesign = appState.currentPair.find(design => design.id === selectedDesignId);
		const rejectedDesign = appState.currentPair.find(design => design.id !== selectedDesignId);

		if (!selectedDesign || !rejectedDesign) {
			console.error('❌ Invalid selection - design not found in current pair');
			return false;
		}

		// Calculate time to decision from timer if available
		let timeToDecision = null;
		if (typeof getTimerState === 'function') {
			const timerState = getTimerState();
			if (timerState && timerState.duration && timerState.currentTime !== undefined) {
				timeToDecision = Number((timerState.duration - timerState.currentTime).toFixed(2));
			}
		}

		// Record the selection with complete metadata
		const selectionRecord = {
			timestamp: new Date().toISOString(),
			selectedId: selectedDesign.id,
			rejectedId: rejectedDesign.id,
			roundNumber: appState.currentRound + 1,
			timeToDecision: timeToDecision,
			selectedTags: selectedDesign.tags || {},
			rejectedTags: rejectedDesign.tags || {}
		};

		appState.selections.push(selectionRecord);
		appState.currentRound++;
		appState.totalRounds++;

		// Mark the current pair as used to prevent duplicates
		const pairKey = `${appState.currentPair[0].id}|${appState.currentPair[1].id}`;
		appState.usedPairs.add(pairKey);

		if (appState.config.enableLogging) {
			const timeText = timeToDecision ? ` in ${timeToDecision}s` : '';
			console.log(`✅ Selection recorded: ${selectedDesign.id} chosen over ${rejectedDesign.id}${timeText}`);
		}

		// Stop timer immediately when selection is made (requirement 2.4)
		if (typeof stopTimer === 'function') {
			stopTimer();
		}

		// Update progress display (requirement 3.1)
		updateProgressDisplay();

		// Check if we should show results or continue
		if (shouldShowResults()) {
			showResultsPrompt();
		} else {
			// Load next pair with small delay for better UX
			setTimeout(() => {
				loadNextPair();
			}, 500);
		}

		return true;

	} catch (error) {
		handleAppError(error, 'handleSelection');
		return false;
	}
}

/**
 * Updates the progress display in the UI
 * Implements requirements 3.1, 3.2, 3.3, 3.4
 */
function updateProgressDisplay() {
	const progressText = document.getElementById('progress-text');
	const progressBar = document.getElementById('progress-bar');
	const progressContainer = document.getElementById('progress-section');

	if (progressText) {
		// Requirement 3.1 & 3.2: Display progress indicator showing current choice number and total completed
		const remaining = Math.max(0, appState.minChoicesRequired - appState.totalRounds);

		if (appState.totalRounds < appState.minChoicesRequired) {
			// Still working toward minimum threshold
			progressText.textContent = `Choice ${appState.totalRounds} of ${appState.minChoicesRequired} (${remaining} more needed for results)`;
		} else {
			// Minimum threshold reached - results available
			// Requirement 3.3: Indicate when results will be available
			progressText.textContent = `Choice ${appState.totalRounds} completed - Results available!`;
		}
	}

	if (progressBar) {
		// Visual progress bar - fill to 100% when minimum reached, then continue beyond
		const percentage = Math.min(100, (appState.totalRounds / appState.minChoicesRequired) * 100);
		progressBar.style.setProperty('--progress', `${percentage}%`);

		// Add visual indicator when minimum threshold is reached
		if (appState.totalRounds >= appState.minChoicesRequired) {
			progressBar.classList.add('threshold-reached');
		} else {
			progressBar.classList.remove('threshold-reached');
		}
	}

	// Add visual emphasis when minimum threshold is reached
	if (progressContainer) {
		if (appState.totalRounds >= appState.minChoicesRequired) {
			progressContainer.classList.add('results-available');
		} else {
			progressContainer.classList.remove('results-available');
		}
	}

	// Log progress for debugging
	if (appState.config.enableLogging) {
		console.log(`📊 Progress: ${appState.totalRounds}/${appState.minChoicesRequired} choices completed`);
	}
}

/**
 * Determines if we should show the continue/results prompt
 * Implements requirement 3.4: Ask user after 20 choices if they want to continue
 * @returns {boolean} - True if we should show the prompt
 */
function shouldShowResults() {
	// Show prompt when we reach minimum threshold or multiples of 20
	return appState.totalRounds >= appState.minChoicesRequired &&
		appState.totalRounds % 20 === 0 &&
		appState.currentSession <= appState.maxSessions;
}

/**
 * Shows the results prompt asking user if they want to continue or see results
 * Implements requirement 3.4: When 20 choices completed, ask if user wants another 20
 */
function showResultsPrompt() {
	if (appState.config.enableLogging) {
		console.log(`🎯 Showing results prompt after ${appState.totalRounds} choices`);
	}

	// Hide selection section
	const selectionSection = document.getElementById('selection-section');
	if (selectionSection) {
		selectionSection.style.display = 'none';
	}

	// Show continue prompt
	showContinuePrompt();
}

/**
 * Shows the continue prompt UI asking user if they want more choices or results
 * Implements requirement 3.4
 */
function showContinuePrompt() {
	// Create or show continue prompt section
	let continueSection = document.getElementById('continue-section');

	if (!continueSection) {
		continueSection = createContinuePromptSection();
		const appContainer = document.querySelector('.app-container');
		const resultsSection = document.getElementById('results-section');
		appContainer.insertBefore(continueSection, resultsSection);
	}

	// Update prompt text based on current session
	const promptText = continueSection.querySelector('.continue-prompt-text');
	const choicesText = continueSection.querySelector('.choices-completed-text');

	if (promptText && choicesText) {
		choicesText.textContent = `You've completed ${appState.totalRounds} choices!`;

		if (appState.currentSession < appState.maxSessions) {
			promptText.textContent = `Would you like to make 20 more choices for better results, or see your current preferences?`;
		} else {
			promptText.textContent = `You've reached the maximum of ${appState.totalRounds} choices. Ready to see your results?`;
		}
	}

	// Show/hide continue button based on session limit
	const continueBtn = continueSection.querySelector('#continue-choices-btn');
	if (continueBtn) {
		continueBtn.style.display = appState.currentSession < appState.maxSessions ? 'inline-flex' : 'none';
	}

	continueSection.style.display = 'block';
}

/**
 * Creates the continue prompt section HTML
 * @returns {HTMLElement} - The continue prompt section element
 */
function createContinuePromptSection() {
	const section = document.createElement('section');
	section.className = 'continue-section';
	section.id = 'continue-section';
	section.style.display = 'none';

	section.innerHTML = `
		<div class="continue-container">
			<div class="continue-header">
				<h2>Great Progress!</h2>
				<p class="choices-completed-text">You've completed ${appState.totalRounds} choices!</p>
				<p class="continue-prompt-text">Would you like to make 20 more choices for better results, or see your current preferences?</p>
			</div>

			<div class="continue-actions">
				<button class="btn btn-primary" id="continue-choices-btn">Continue with 20 More</button>
				<button class="btn btn-secondary" id="show-results-btn">Show My Results</button>
			</div>

			<div class="continue-info">
				<p class="session-info">Session ${appState.currentSession} of ${appState.maxSessions}</p>
			</div>
		</div>
	`;

	// Add event listeners
	const continueBtn = section.querySelector('#continue-choices-btn');
	const resultsBtn = section.querySelector('#show-results-btn');

	if (continueBtn) {
		continueBtn.addEventListener('click', handleContinueChoices);
	}

	if (resultsBtn) {
		resultsBtn.addEventListener('click', handleShowResults);
	}

	return section;
}

/**
 * Handles user choosing to continue with more choices
 * Implements requirement 3.4: Allow up to 2 more sessions (3 total)
 */
function handleContinueChoices() {
	if (appState.currentSession >= appState.maxSessions) {
		console.warn('⚠️ Maximum sessions reached, cannot continue');
		return;
	}

	// Increment session
	appState.currentSession++;
	appState.currentRound = 0; // Reset round counter for new session

	if (appState.config.enableLogging) {
		console.log(`🔄 Starting session ${appState.currentSession} of ${appState.maxSessions}`);
	}

	// Hide continue prompt
	const continueSection = document.getElementById('continue-section');
	if (continueSection) {
		continueSection.style.display = 'none';
	}

	// Update progress display
	updateProgressDisplay();

	// Load next pair
	setTimeout(() => {
		loadNextPair();
	}, 500);
}

/**
 * Handles user choosing to see results
 */
function handleShowResults() {
	if (appState.config.enableLogging) {
		console.log('📊 User chose to see results');
	}

	// Mark as complete
	appState.isComplete = true;

	// Hide continue prompt
	const continueSection = document.getElementById('continue-section');
	if (continueSection) {
		continueSection.style.display = 'none';
	}

	// Show the actual results analysis
	showResults();
}

/**
 * Shows the actual results analysis and design preference profile
 * Implements requirements 4.3, 4.4, 4.5: Display ranked tag lists and design profile
 */
function showResults() {
	try {
		if (appState.config.enableLogging) {
			console.log(`🎨 Displaying results for ${appState.totalRounds} selections`);
		}

		// Ensure we have the required data
		if (!appState.selections || appState.selections.length === 0) {
			throw new Error('No selections available for analysis');
		}

		if (!appState.designs || appState.designs.length === 0) {
			throw new Error('No design data available for analysis');
		}

		// Use the displayResults function from results.js
		displayResults(appState.selections, appState.designs);

		// Set up the action buttons
		setupResultsActions();

		// Hide other sections
		hideOtherSections();

		if (appState.config.enableLogging) {
			console.log('✅ Results displayed successfully');
		}

	} catch (error) {
		console.error('❌ Failed to show results:', error.message);

		// Fallback to show error message
		const resultsSection = document.getElementById('results-section');
		if (resultsSection) {
			const preferenceCategoriesContainer = document.getElementById('preference-categories');
			if (preferenceCategoriesContainer) {
				preferenceCategoriesContainer.innerHTML = `
					<div class="error-container">
						<h3>Unable to Display Results</h3>
						<p>There was an error generating your design preference profile: ${error.message}</p>
						<p>You completed ${appState.totalRounds} choices. Please try refreshing the page.</p>
					</div>
				`;
			}
			resultsSection.style.display = 'block';
		}
	}
}

/**
 * Sets up event listeners for results action buttons
 */
function setupResultsActions() {
	// Set up refine preferences button
	const refineBtn = document.getElementById('refine-preferences-btn');
	if (refineBtn) {
		// Remove existing listeners
		refineBtn.replaceWith(refineBtn.cloneNode(true));
		const newRefineBtn = document.getElementById('refine-preferences-btn');

		newRefineBtn.addEventListener('click', () => {
			if (appState.config.enableLogging) {
				console.log('🔄 User chose to refine preferences');
			}
			handleRefinePreferences();
		});
	}

	// Set up start over button
	const startOverBtn = document.getElementById('start-over-btn');
	if (startOverBtn) {
		// Remove existing listeners
		startOverBtn.replaceWith(startOverBtn.cloneNode(true));
		const newStartOverBtn = document.getElementById('start-over-btn');

		newStartOverBtn.addEventListener('click', () => {
			if (appState.config.enableLogging) {
				console.log('🔄 User chose to start over');
			}
			location.reload();
		});
	}

	// Set up email results button
	const emailResultsBtn = document.getElementById('email-results-btn');
	if (emailResultsBtn) {
		// Remove existing listeners
		emailResultsBtn.replaceWith(emailResultsBtn.cloneNode(true));
		const newEmailResultsBtn = document.getElementById('email-results-btn');

		newEmailResultsBtn.addEventListener('click', () => {
			if (appState.config.enableLogging) {
				console.log('📧 User chose to email results');
			}
			// Show email form using the email.js functionality
			if (typeof showEmailForm === 'function') {
				showEmailForm();
			} else {
				console.error('❌ Email functionality not available');
				alert('Email functionality is not available. Please ensure email.js is loaded.');
			}
		});
	}
}

/**
 * Hides other sections when showing results
 */
function hideOtherSections() {
	const sectionsToHide = [
		'timer-section',
		'progress-section',
		'selection-section',
		'loading-section'
	];

	sectionsToHide.forEach(sectionId => {
		const section = document.getElementById(sectionId);
		if (section) {
			section.style.display = 'none';
		}
	});

	// Also hide any continue prompt sections
	const continueSection = document.querySelector('.continue-section');
	if (continueSection) {
		continueSection.style.display = 'none';
	}
}

/**
 * Shows the selection section and hides loading section
 */
function showSelectionSection() {
	const selectionSection = document.getElementById('selection-section');
	const loadingSection = document.getElementById('loading-section');

	if (selectionSection) {
		selectionSection.style.display = 'block';
	}

	if (loadingSection) {
		loadingSection.style.display = 'none';
	}
}

/**
 * Shows the loading section and hides selection section
 */
function showLoadingSection() {
	const selectionSection = document.getElementById('selection-section');
	const loadingSection = document.getElementById('loading-section');

	if (selectionSection) {
		selectionSection.style.display = 'none';
	}

	if (loadingSection) {
		loadingSection.style.display = 'block';
	}
}

/**
 * Sets up click, touch, and keyboard handlers for image selection
 * Enhanced for mobile touch interactions and keyboard navigation
 */
function setupImageClickHandlers() {
	const option1 = document.getElementById('image-option-1');
	const option2 = document.getElementById('image-option-2');

	// Set up handlers for both options
	setupImageOptionHandlers(option1, 'option-1');
	setupImageOptionHandlers(option2, 'option-2');

	// Set up keyboard navigation
	setupKeyboardNavigation();

	if (appState.config.enableLogging) {
		console.log('✅ Image click, touch, and keyboard handlers set up');
	}
}

/**
 * Sets up comprehensive event handlers for an image option
 * Includes touch events for better mobile experience
 * @param {HTMLElement} element - The image option element
 * @param {string} optionName - Name for logging purposes
 */
function setupImageOptionHandlers(element, optionName) {
	if (!element) return;

	let touchStartTime = 0;
	let touchStartX = 0;
	let touchStartY = 0;
	let isTouch = false;

	// Touch start handler
	element.addEventListener('touchstart', (event) => {
		isTouch = true;
		touchStartTime = Date.now();

		const touch = event.touches[0];
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;

		// Add visual feedback for touch
		element.classList.add('touch-active');

		// Prevent default to avoid double-tap zoom and scrolling issues
		event.preventDefault();

		if (appState.config.enableLogging) {
			console.log(`👆 Touch start on ${optionName}`);
		}
	}, { passive: false });

	// Touch end handler
	element.addEventListener('touchend', (event) => {
		const touchEndTime = Date.now();
		const touchDuration = touchEndTime - touchStartTime;

		// Remove visual feedback
		element.classList.remove('touch-active');

		// Only process if it was a quick tap (not a long press or drag)
		if (touchDuration < 500) {
			const designId = element.dataset.designId;
			if (designId) {
				handleSelection(designId);

				if (appState.config.enableLogging) {
					console.log(`✅ Touch selection: ${designId} (${touchDuration}ms)`);
				}
			}
		}

		// Prevent default to avoid click event firing
		event.preventDefault();
		isTouch = false;
	}, { passive: false });

	// Touch move handler to detect dragging
	element.addEventListener('touchmove', (event) => {
		const touch = event.touches[0];
		const deltaX = Math.abs(touch.clientX - touchStartX);
		const deltaY = Math.abs(touch.clientY - touchStartY);

		// If user is dragging significantly, remove active state
		if (deltaX > 10 || deltaY > 10) {
			element.classList.remove('touch-active');
		}

		// Allow scrolling if moving vertically
		if (deltaY > deltaX) {
			return;
		}

		// Prevent horizontal scrolling during image interaction
		event.preventDefault();
	}, { passive: false });

	// Touch cancel handler
	element.addEventListener('touchcancel', (event) => {
		element.classList.remove('touch-active');
		isTouch = false;
		event.preventDefault();
	});

	// Click handler for mouse/desktop interactions
	element.addEventListener('click', (event) => {
		// Prevent click if this was a touch interaction
		if (isTouch) {
			event.preventDefault();
			return;
		}

		event.preventDefault();
		const designId = element.dataset.designId;
		if (designId) {
			handleSelection(designId);

			if (appState.config.enableLogging) {
				console.log(`🖱️ Click selection: ${designId}`);
			}
		}
	});

	// Mouse enter/leave for desktop hover effects
	element.addEventListener('mouseenter', () => {
		if (!isTouch) {
			element.classList.add('hover-active');
		}
	});

	element.addEventListener('mouseleave', () => {
		element.classList.remove('hover-active');
	});

	// Prevent context menu on long press
	element.addEventListener('contextmenu', (event) => {
		event.preventDefault();
	});
}

/**
 * Sets up keyboard navigation for image selection and skipping
 * Supports: 1 key (select first option), 2 key (select second option), spacebar (skip)
 */
function setupKeyboardNavigation() {
	// Remove any existing keyboard listeners to prevent duplicates
	document.removeEventListener('keydown', handleKeyboardNavigation);

	// Add keyboard event listener
	document.addEventListener('keydown', handleKeyboardNavigation);

	if (appState.config.enableLogging) {
		console.log('⌨️ Keyboard navigation set up (1, 2, spacebar)');
	}
}

/**
 * Handles keyboard navigation events
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyboardNavigation(event) {
	// Only handle keyboard navigation during selection phase
	const selectionSection = document.getElementById('selection-section');
	if (!selectionSection || selectionSection.style.display === 'none') {
		return;
	}

	// Don't interfere with form inputs
	if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
		return;
	}

	const key = event.key;
	let handled = false;

	switch (key) {
		case '1':
			// Select first option with visual feedback
			const option1 = document.getElementById('image-option-1');
			if (option1 && option1.dataset.designId) {
				// Add visual feedback
				option1.classList.add('keyboard-selected');
				setTimeout(() => option1.classList.remove('keyboard-selected'), 200);

				handleSelection(option1.dataset.designId);
				handled = true;

				if (appState.config.enableLogging) {
					console.log('⌨️ Keyboard selection: Option 1');
				}
			}
			break;

		case '2':
			// Select second option with visual feedback
			const option2 = document.getElementById('image-option-2');
			if (option2 && option2.dataset.designId) {
				// Add visual feedback
				option2.classList.add('keyboard-selected');
				setTimeout(() => option2.classList.remove('keyboard-selected'), 200);

				handleSelection(option2.dataset.designId);
				handled = true;

				if (appState.config.enableLogging) {
					console.log('⌨️ Keyboard selection: Option 2');
				}
			}
			break;

		case ' ':
		case 'Spacebar':
			// Skip current pair with visual feedback
			showSkipFeedback();
			handleSkipPair();
			handled = true;

			if (appState.config.enableLogging) {
				console.log('⌨️ Keyboard skip: Spacebar');
			}
			break;
	}

	if (handled) {
		event.preventDefault();
		event.stopPropagation();
	}
}

/**
 * Shows visual feedback when user skips a pair
 */
function showSkipFeedback() {
	const vsDivider = document.querySelector('.vs-divider');
	if (vsDivider) {
		const originalText = vsDivider.textContent;
		vsDivider.textContent = 'Skipped';
		vsDivider.classList.add('skip-feedback');

		setTimeout(() => {
			vsDivider.textContent = originalText;
			vsDivider.classList.remove('skip-feedback');
		}, 500);
	}
}

/**
 * Handles skipping the current pair without making a selection
 * Loads the next pair without recording a choice
 */
function handleSkipPair() {
	try {
		if (!appState.currentPair || appState.currentPair.length !== 2) {
			console.warn('⚠️ No current pair available to skip');
			return false;
		}

		// Mark the current pair as used to prevent it from showing again
		const pairKey = `${appState.currentPair[0].id}|${appState.currentPair[1].id}`;
		appState.usedPairs.add(pairKey);

		// Stop timer if running
		if (typeof stopTimer === 'function') {
			stopTimer();
		}

		// Load next pair with small delay for better UX
		setTimeout(() => {
			loadNextPair();
		}, 300);

		if (appState.config.enableLogging) {
			console.log(`⏭️ Skipped pair: ${appState.currentPair[0].id} vs ${appState.currentPair[1].id}`);
		}

		return true;

	} catch (error) {
		handleAppError(error, 'handleSkipPair');
		return false;
	}
}

/**
 * Initializes the image pair selection system
 * Should be called after app initialization
 */
function initializeImagePairSystem() {
	try {
		if (!isAppReady()) {
			throw new Error('App not ready for image pair system initialization');
		}

		// Set up instructions section handlers
		setupInstructionsHandlers();

		// Set up click handlers
		setupImageClickHandlers();

		// Initialize progress display
		updateProgressDisplay();

		// Show instructions first, then load first pair when user is ready
		showInstructionsSection();

		if (appState.config.enableLogging) {
			console.log('🎉 Image pair selection system initialized with instructions');
		}

		return true;

	} catch (error) {
		handleAppError(error, 'initializeImagePairSystem');
		return false;
	}
}

/**
 * Sets up event handlers for the instructions section
 */
function setupInstructionsHandlers() {
	const startBtn = document.getElementById('start-app-btn');
	const skipBtn = document.getElementById('skip-instructions-btn');

	if (startBtn) {
		startBtn.addEventListener('click', () => {
			hideInstructionsSection();
			startImageSelection();
		});
	}

	if (skipBtn) {
		skipBtn.addEventListener('click', () => {
			hideInstructionsSection();
			startImageSelection();
		});
	}

	if (appState.config.enableLogging) {
		console.log('✅ Instructions handlers set up');
	}
}

/**
 * Shows the instructions section and hides other sections
 */
function showInstructionsSection() {
	const instructionsSection = document.getElementById('instructions-section');
	const timerSection = document.getElementById('timer-section');
	const progressSection = document.getElementById('progress-section');
	const selectionSection = document.getElementById('selection-section');
	const loadingSection = document.getElementById('loading-section');

	if (instructionsSection) {
		instructionsSection.style.display = 'block';
	}

	// Hide other sections
	[timerSection, progressSection, selectionSection, loadingSection].forEach(section => {
		if (section) {
			section.style.display = 'none';
		}
	});
}

/**
 * Hides the instructions section
 */
function hideInstructionsSection() {
	const instructionsSection = document.getElementById('instructions-section');
	if (instructionsSection) {
		instructionsSection.style.display = 'none';
	}

	// Show timer and progress sections
	const timerSection = document.getElementById('timer-section');
	const progressSection = document.getElementById('progress-section');

	if (timerSection) {
		timerSection.style.display = 'block';
	}

	if (progressSection) {
		progressSection.style.display = 'block';
	}
}

/**
 * Starts the image selection process after instructions
 */
function startImageSelection() {
	showLoadingSection();

	// Small delay to show loading state
	setTimeout(() => {
		const success = loadNextPair();
		if (!success) {
			handleAppError(new Error('Failed to load initial image pair'), 'startImageSelection');
		}
	}, 500);

	if (appState.config.enableLogging) {
		console.log('🚀 Started image selection process');
	}
}

/**
 * Handles the user's request to refine their preferences
 * Hides results and continues with more image selections
 */
function handleRefinePreferences() {
	try {
		if (appState.config.enableLogging) {
			console.log('🔄 Starting preference refinement process');
		}

		// Hide results section
		const resultsSection = document.getElementById('results-section');
		if (resultsSection) {
			resultsSection.style.display = 'none';
		}

		// Show timer and progress sections
		const timerSection = document.getElementById('timer-section');
		const progressSection = document.getElementById('progress-section');

		if (timerSection) {
			timerSection.style.display = 'block';
		}

		if (progressSection) {
			progressSection.style.display = 'block';
		}

		// Reset current round counter but keep total rounds and selections
		appState.currentRound = 0;
		appState.isComplete = false;

		// Update progress display to reflect current state
		updateProgressDisplay();

		// Show loading and then load next pair
		showLoadingSection();

		setTimeout(() => {
			const success = loadNextPair();
			if (!success) {
				handleAppError(new Error('Failed to load pair for refinement'), 'handleRefinePreferences');
			}
		}, 500);

		if (appState.config.enableLogging) {
			console.log(`✅ Preference refinement started. Current total: ${appState.totalRounds} choices`);
		}

	} catch (error) {
		handleAppError(error, 'handleRefinePreferences');
	}
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		appState,
		initializeApp,
		resetApplicationState,
		getAppState,
		isAppReady,
		getAppStatus,
		validateDependencies,
		handleAppError,
		clearAppError,
		loadNextPair,
		handleSelection,
		initializeImagePairSystem
	};
}

// Make functions available globally for browser use
if (typeof window !== 'undefined') {
	window.appState = appState;
	window.initializeApp = initializeApp;
	window.resetApplicationState = resetApplicationState;
	window.getAppState = getAppState;
	window.isAppReady = isAppReady;
	window.getAppStatus = getAppStatus;
	window.validateDependencies = validateDependencies;
	window.handleAppError = handleAppError;
	window.clearAppError = clearAppError;
	window.hideErrorState = hideErrorState;
	window.showSelectionSection = showSelectionSection;
	window.clearAllUIStates = clearAllUIStates;
	window.loadNextPair = loadNextPair;
	window.handleSelection = handleSelection;
	window.initializeImagePairSystem = initializeImagePairSystem;
}

/**
 * Sets up network status monitoring
 */
function setupNetworkMonitoring() {
	if (typeof window === 'undefined' || typeof navigator === 'undefined') {
		return; // Not in browser environment
	}

	// Create network status indicator
	const networkStatus = document.createElement('div');
	networkStatus.id = 'network-status';
	networkStatus.className = 'network-status';
	document.body.appendChild(networkStatus);

	// Update network status display
	const updateNetworkStatus = () => {
		const isOnline = navigator.onLine;
		networkStatus.className = `network-status ${isOnline ? 'online' : 'offline'}`;
		networkStatus.textContent = isOnline ? '🟢 Online' : '🔴 Offline';

		if (!isOnline) {
			networkStatus.title = 'You are offline. Some features may not work properly.';
		} else {
			networkStatus.title = 'Connected to the internet';
		}

		// Auto-hide online status after 3 seconds
		if (isOnline) {
			setTimeout(() => {
				if (navigator.onLine) {
					networkStatus.style.opacity = '0';
					setTimeout(() => {
						if (navigator.onLine) {
							networkStatus.style.display = 'none';
						}
					}, 300);
				}
			}, 3000);
		} else {
			networkStatus.style.display = 'block';
			networkStatus.style.opacity = '1';
		}
	};

	// Listen for network status changes
	window.addEventListener('online', () => {
		console.log('🟢 Network connection restored');
		updateNetworkStatus();

		// Try to reload failed images
		retryFailedImages();
	});

	window.addEventListener('offline', () => {
		console.log('🔴 Network connection lost');
		updateNetworkStatus();
	});

	// Initial status check
	updateNetworkStatus();
}

/**
 * Retries loading failed images when network is restored
 */
function retryFailedImages() {
	const failedImages = document.querySelectorAll('.image-option.error');

	failedImages.forEach(container => {
		const img = container.querySelector('.design-image');
		const designId = container.dataset.designId;

		if (img && designId && appState.designs) {
			const design = appState.designs.find(d => d.id === designId);
			if (design) {
				console.log(`🔄 Retrying failed image: ${designId}`);
				setupImageElement(img, design, container);
			}
		}
	});
}

/**
 * Checks if the application can function offline
 * @returns {boolean} - True if offline functionality is available
 */
function canWorkOffline() {
	try {
		// Check if we have cached data
		if (typeof localStorage !== 'undefined') {
			const cacheKeys = Object.keys(localStorage).filter(key =>
				key.startsWith('this-or-that-data-')
			);
			return cacheKeys.length > 0;
		}
		return false;
	} catch (error) {
		return false;
	}
}

/**
 * Shows offline mode notification
 */
function showOfflineNotification() {
	const notification = document.createElement('div');
	notification.className = 'offline-notification';
	notification.innerHTML = `
		<div class="offline-notification-content">
			<h4>🔴 You're offline</h4>
			<p>Using cached data. Some features may be limited.</p>
			<button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()">
				Dismiss
			</button>
		</div>
	`;

	// Add styles
	notification.style.cssText = `
		position: fixed;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 8px;
		padding: 16px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		z-index: 1000;
		max-width: 400px;
		text-align: center;
	`;

	document.body.appendChild(notification);

	// Auto-remove after 10 seconds
	setTimeout(() => {
		if (notification.parentElement) {
			notification.remove();
		}
	}, 10000);
}
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
		timerDuration: 30,                  // Timer duration in seconds
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

		// Initialize data loader
		if (typeof AppDataLoader === 'undefined') {
			throw new Error('AppDataLoader not available. Make sure app-data-loader.js is loaded first.');
		}

		appState.dataLoader = new AppDataLoader();

		// Try to load primary data source, fall back to sample data if needed
		let loadedData = null;
		try {
			loadedData = await appState.dataLoader.loadDesigns(appState.config.dataPath);
			if (appState.config.enableLogging) {
				console.log(`✅ Loaded data from ${appState.config.dataPath}`);
			}
		} catch (primaryError) {
			if (appState.config.enableLogging) {
				console.warn(`⚠️ Failed to load ${appState.config.dataPath}, trying fallback...`);
			}

			try {
				loadedData = await appState.dataLoader.loadDesigns(appState.config.fallbackDataPath);
				if (appState.config.enableLogging) {
					console.log(`✅ Loaded fallback data from ${appState.config.fallbackDataPath}`);
				}
			} catch (fallbackError) {
				throw new Error(`Failed to load both primary and fallback data sources: ${primaryError.message}, ${fallbackError.message}`);
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
 * Sets up an individual image element with loading states and error handling
 * @param {HTMLImageElement} imgElement - The image element
 * @param {Object} design - The design object
 * @param {HTMLElement} containerElement - The container element
 */
function setupImageElement(imgElement, design, containerElement) {
	// Store design ID on container for click handling
	containerElement.dataset.designId = design.id;

	// Add loading class
	containerElement.classList.add('loading');

	// Set up image load handlers
	imgElement.onload = () => {
		containerElement.classList.remove('loading');
		containerElement.classList.add('loaded');

		if (appState.config.enableLogging) {
			console.log(`✅ Image loaded: ${design.id}`);
		}
	};

	imgElement.onerror = () => {
		containerElement.classList.remove('loading');
		containerElement.classList.add('error');

		// Set fallback image or placeholder
		imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFVuYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
		imgElement.alt = `Design ${design.id} - Image unavailable`;

		console.warn(`⚠️ Failed to load image: ${design.id}`);
	};

	// Set image source and alt text
	imgElement.src = design.image;
	imgElement.alt = design.title || `Design option ${design.id}`;
}

/**
 * Preloads the next set of images in the background for better performance
 */
function preloadNextImages() {
	try {
		// Get next potential pairs for preloading
		const nextPairs = appState.dataLoader.getRandomPairs(2, appState.usedPairs);

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
	} catch (error) {
		// Preloading failure shouldn't break the app
		console.warn('⚠️ Failed to preload images:', error.message);
	}
}

/**
 * Handles user selection of an image
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

		// Record the selection
		const selectionRecord = {
			timestamp: new Date().toISOString(),
			selectedId: selectedDesign.id,
			rejectedId: rejectedDesign.id,
			roundNumber: appState.currentRound + 1,
			timeToDecision: null // Will be set by timer if available
		};

		appState.selections.push(selectionRecord);
		appState.currentRound++;
		appState.totalRounds++;

		if (appState.config.enableLogging) {
			console.log(`✅ Selection recorded: ${selectedDesign.id} chosen over ${rejectedDesign.id}`);
		}

		// Update progress display
		updateProgressDisplay();

		// Check if we should show results or continue
		if (shouldShowResults()) {
			showResultsPrompt();
		} else {
			// Load next pair
			setTimeout(() => {
				loadNextPair();
			}, 500); // Small delay for better UX
		}

		return true;

	} catch (error) {
		handleAppError(error, 'handleSelection');
		return false;
	}
}

/**
 * Updates the progress display in the UI
 */
function updateProgressDisplay() {
	const progressText = document.getElementById('progress-text');
	const progressBar = document.getElementById('progress-bar');

	if (progressText) {
		const remaining = Math.max(0, appState.minChoicesRequired - appState.totalRounds);
		if (remaining > 0) {
			progressText.textContent = `Choice ${appState.totalRounds} of ${appState.minChoicesRequired}+ (${remaining} more needed)`;
		} else {
			progressText.textContent = `Choice ${appState.totalRounds} - Results available!`;
		}
	}

	if (progressBar) {
		const percentage = Math.min(100, (appState.totalRounds / appState.minChoicesRequired) * 100);
		progressBar.style.setProperty('--progress', `${percentage}%`);
	}
}

/**
 * Determines if results should be shown based on current progress
 * @returns {boolean} - True if results should be shown
 */
function shouldShowResults() {
	return appState.totalRounds >= appState.minChoicesRequired &&
		(appState.currentRound % appState.maxRoundsPerSession === 0 ||
			appState.currentSession >= appState.maxSessions);
}

/**
 * Shows the results prompt or continues to next session
 */
function showResultsPrompt() {
	// This will be implemented when results functionality is added
	// For now, just continue loading pairs
	if (appState.totalRounds < appState.minChoicesRequired * appState.maxSessions) {
		setTimeout(() => {
			loadNextPair();
		}, 1000);
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
 * Sets up click handlers for image selection
 */
function setupImageClickHandlers() {
	const option1 = document.getElementById('image-option-1');
	const option2 = document.getElementById('image-option-2');

	if (option1) {
		option1.addEventListener('click', (event) => {
			event.preventDefault();
			const designId = option1.dataset.designId;
			if (designId) {
				handleSelection(designId);
			}
		});
	}

	if (option2) {
		option2.addEventListener('click', (event) => {
			event.preventDefault();
			const designId = option2.dataset.designId;
			if (designId) {
				handleSelection(designId);
			}
		});
	}

	if (appState.config.enableLogging) {
		console.log('✅ Image click handlers set up');
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

		// Set up click handlers
		setupImageClickHandlers();

		// Load first pair
		showLoadingSection();
		const success = loadNextPair();

		if (!success) {
			throw new Error('Failed to load initial image pair');
		}

		if (appState.config.enableLogging) {
			console.log('🎉 Image pair selection system initialized');
		}

		return true;

	} catch (error) {
		handleAppError(error, 'initializeImagePairSystem');
		return false;
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
	window.loadNextPair = loadNextPair;
	window.handleSelection = handleSelection;
	window.initializeImagePairSystem = initializeImagePairSystem;
}
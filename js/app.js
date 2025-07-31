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
		clearAppError
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
}